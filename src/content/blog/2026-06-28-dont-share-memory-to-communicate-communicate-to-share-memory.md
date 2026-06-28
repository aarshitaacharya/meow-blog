---
title: "Don't share memory to communicate. Communicate to share memory."
description: "Go has a different answer to concurrency than most languages."
date: 2026-06-28
tags: ["go", "concurrency"]
draft: false
---

Last time I fixed a data race by putting a mutex around my map. It worked. But this week I read something that made me question whether the mutex was even the right move.

The Go team's advice is this:

> Do not communicate by sharing memory. Instead, share memory by communicating.

I had to read that a few times before it landed.

## What most languages do

In most languages, concurrency looks like this: you have some shared data, and you protect it with a lock. Every thread that wants to touch the data has to grab the lock first, do its thing, and release it. Everyone else waits their turn.

This works. But it has problems.

The lock and the data are separate things. Nothing stops you from forgetting to lock before writing. Nothing stops two parts of your code from locking in different orders and deadlocking. The bigger your codebase gets, the harder it is to reason about who holds what lock and when.

The mutex I wrote last week is exactly this pattern. The map and the `sync.RWMutex` sit next to each other, and every goroutine is trusted to remember to lock before touching the map.

## What Go suggests instead

Go's answer is channels. Instead of multiple goroutines all reaching into shared memory, you have one goroutine that owns the data, and everyone else sends it messages through a channel.

Only one goroutine touches the data at any given moment. Not because of a lock, but because of ownership. The data moves between goroutines, so there is never a moment where two of them hold it at the same time.

The official Go blog shows this with a URL poller example. The mutex version needs a struct with a lock field, a `polling` boolean, and careful lock/unlock calls wrapped around every access. The channel version strips all of that away:

```go
type Resource string

func Poller(in, out chan *Resource) {
    for r := range in {
        // poll the URL
        out <- r
    }
}
```

No lock. No shared struct. No bookkeeping flags. A resource comes in, gets processed, goes out. One goroutine at a time holds the reference.

## The mental shift

With a mutex, the question you ask is: "am I allowed to touch this right now?" You coordinate access to the same object.

With channels, the question is: "whose turn is it to own this?" You hand the object off. At any point, only one goroutine holds it.

It is the difference between a shared whiteboard where everyone tries not to write at the same time, versus passing a single marker around the room. One requires discipline. The other makes the problem physically impossible.

## When to use which

Channels are not always the answer. For something simple like a counter or a cache, a mutex is less code and easier to follow. The Go standard library uses mutexes all over the place internally.

The channel pattern shines when the logic around the data is complex, when multiple goroutines need to coordinate, or when ownership of the data changes meaningfully as it moves through the system.

A good rule of thumb from the Go docs: if you are just protecting a value, use a mutex. If you are passing work between goroutines, use a channel.

## Where this leaves my server

My current server uses a `sync.RWMutex` around a `map[string]string`. That is fine for what it is. But the channel approach would look different: one dedicated goroutine owns the map and all reads and writes go through a command channel. Every other goroutine sends a request and waits for a reply. No lock needed because only one goroutine ever touches the map.

That is closer to how Redis actually works. One main loop owns everything. Everyone else sends it commands. The event loop from two weeks ago is exactly this pattern, just without the channel abstraction. One owner, everyone else communicates through it.

The mutex was the right fix for the crash. But channels are the better architecture once the system grows.
