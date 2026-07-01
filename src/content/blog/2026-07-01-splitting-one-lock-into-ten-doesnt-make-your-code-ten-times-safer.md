---
title: "Splitting one lock into ten doesn't make your code ten times safer"
description: "More locks means more ways to deadlock."
date: 2026-07-01
tags: ["systems", "concurrency", "locks"]
draft: false
---

When my server's mutex felt slow, my first instinct was to split it. One big lock around the whole map felt clumsy. Surely a separate lock per key, or per bucket of keys, would be faster and smarter. The Cantrill and Bonwick paper talks directly about why that instinct can backfire.

## The appeal of smaller locks

Right now my server has one `sync.RWMutex` guarding the entire `map[string]string`. Every write blocks every other write, even if they touch completely unrelated keys. Setting `user:1` and setting `user:2` at the same time still have to wait their turn.

Splitting that into many smaller locks, say one lock per key or one lock per shard of the map, sounds like the obvious fix. Less contention, more parallelism, everyone happy.

## The paradox

Here is the catch. More locks means more places for things to go wrong.

Imagine I split my map into 10 shards, each with its own lock. Now picture a command that needs to touch two keys at once, like a `RENAME` command that reads the old key and writes the new one. If `key1` lives in shard A and `key2` lives in shard B, that operation needs to lock both shards.

Now imagine two clients run `RENAME` at the same time, but in opposite order. Client 1 locks shard A first, then tries to lock shard B. Client 2 locks shard B first, then tries to lock shard A. Both are now stuck waiting for a lock the other one is holding. Neither can proceed. That is a deadlock, and it only exists because I split the lock in the first place.

With one single lock around the whole map, this problem cannot happen. There is only one lock. You either have it or you don't.

## The real cost of splitting

Beyond deadlocks, more locks also means:

- More code to reason about. Every function now has to know which lock or locks it needs.
- More overhead per operation, since acquiring two locks is slower than acquiring one, even if there is no contention.
- More bugs from forgetting to acquire a lock in the right order, which is exactly what causes the deadlock above.

## When splitting is actually worth it

The rule from the paper is simple: only split a lock once you have measured real contention on it. Not guessed. Measured.

If my benchmark showed that under heavy concurrent `SET` load, goroutines were spending significant time waiting for the write lock, that would be evidence. At that point, splitting into shards (the same trick Go's own `sync.Map` and real Redis-like systems use internally) becomes worth the added complexity, because the data justifies it.

But doing it preemptively, because it sounds more advanced or more impressive, just adds risk for a performance gain that may not even exist.
