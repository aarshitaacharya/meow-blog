---
title: "I benchmarked two ways to handle concurrency. One was 13x faster."
description: "Channels feel cleaner. Mutexes are faster for reads."
date: 2026-06-29
tags: ["go", "mutex", "channels"]
draft: false
---

Previously, I built the same key-value server two ways. One used a `sync.RWMutex` to protect a shared map. The other used a channel and a single background goroutine that owned the map exclusively. Both were correct. Neither crashed. But I wanted to know which one was actually faster, so I wrote a benchmark.

## The two approaches, quickly

**Mutex:** Every goroutine that wants to read or write the map asks for a lock first. Multiple readers can hold `RLock` at the same time. Writers get exclusive access with `Lock`. The map is shared memory, protected by a gate.

```go
state.mu.RLock()
val := state.db[key]
state.mu.RUnlock()
```

**Channel:** One background goroutine owns the map. Everyone else sends it a function through a channel and waits for a reply on a separate response channel. The map is never shared. Ownership moves through communication.

```go
resChan := make(chan string)
state.actions <- func() {
    resChan <- state.db[key]
}
return <-resChan
```

## The benchmark

I used Go's built-in benchmark tool with `b.RunParallel`, which spawns goroutines to slam the same operation concurrently. This simulates what actually happens on the server: many clients reading at the same time.

```
go test -bench=. -benchtime=10s -timeout=120s
```

Results on an i9-9880H, 16 cores:

| Backend | Operations | Speed |
|---|---|---|
| Mutex GET | 260,059,455 | **48.59 ns/op** |
| Channel GET | 17,532,946 | **640.1 ns/op** |

The mutex was **13x faster** for concurrent reads.

## Why

The mutex result makes sense once you think about what `RLock` actually does. Multiple goroutines can hold a read lock simultaneously. So all 16 benchmark goroutines are reading the map at the same time, in parallel. The only overhead is the lock itself, which is just an atomic CPU instruction. Very cheap.

The channel backend cannot do this. Every single read, no matter how simple, has to:

1. Create a new response channel
2. Send a function onto the `actions` channel
3. Wait for the background goroutine to pick it up
4. Execute the function
5. Send the result back on the response channel
6. The caller receives it

That is a lot of steps for a map lookup. And crucially, the background goroutine is a single bottleneck. Even with 16 goroutines hammering it, only one read happens at a time. All the concurrency is serialized through one chokepoint.

> The mutex lets readers run in parallel. The channel forces them to take turns.

## So channels are bad?

No. They are just the wrong tool for this specific workload: many concurrent reads of a simple value.

Channels shine when the work being coordinated is complex, stateful, or when you want to avoid thinking about locks entirely. For a system where writes are rare and reads are heavy, a `RWMutex` is the better fit. For something where every operation changes state and ordering matters, channels keep the logic clean.

This is also why Redis uses neither. It avoids the problem entirely with a single-threaded event loop. One goroutine, no sharing, no locks, no channels needed. The architecture eliminates the question rather than answering it.

## What I got wrong last week

In the last post I said channels are the better architecture once the system grows. That was too broad. The benchmark shows the real tradeoff: channels trade performance for simplicity of ownership. For a read-heavy cache, that is a bad trade. For a write-heavy coordinator, it might be the right one.

The lesson is not "use channels" or "use mutexes." It is: know what your workload looks like, then measure.
