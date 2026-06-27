---
title: "I crashed my server on purpose to understand why"
description: "What happens when two goroutines write to the same map at the same time."
date: 2026-06-27
tags: ["go", "concurrency"]
draft: false
---

This week I added `SET`, `GET`, `DEL`, and `EXISTS` commands to my TCP server using a plain `map[string]string` as the database. It worked fine when I tested it with one client. Then I tested it with three clients writing at the same time, and it died.

Not a wrong answer. Not bad data. A fatal crash. The Go runtime killed the whole program.

I wanted to understand why, so I added a `CRASH` command on purpose to make it happen faster.

## What the crash command does

```go
case "CRASH":
    for i := 0; i < 100; i++ {
        go func(id int) {
            db["collision_key"] = fmt.Sprintf("value-%d", id)
        }(i)
    }
    return "Chaos unleashed\n"
```

This spawns 100 goroutines simultaneously, all writing to the same map key at the same time. Send `CRASH` from `nc` and within milliseconds:

```
fatal error: concurrent map writes
```

Program dead.

## Why a map is not safe to share

A Go map is not a simple array. Under the hood it is a set of memory buckets with pointers between them. When you write to a map, Go does not just drop a value in one slot. It may move data around, update pointers, and set internal flags to reorganize those buckets.

Now imagine two goroutines doing this at the exact same time on the same map.

Goroutine A is halfway through a write. It has updated one pointer but not the others yet. Right at that moment, Goroutine B comes in and reads those half-updated pointers. B now has corrupted data. What it does with that corrupted data is unpredictable. It might write garbage somewhere in memory. It might follow a bad pointer and touch memory it has no business touching.

This is a **data race**: two threads of execution reading and writing the same memory location at the same time with no coordination between them.

> The dangerous version of this is a language that lets it happen silently. You get wrong answers, corrupted data, and bugs that only show up under load and are nearly impossible to reproduce.

## Why Go crashes instead of corrupting

Go makes a different choice. The runtime actively watches for concurrent map writes and when it detects one, it throws an unrecoverable fatal error immediately.

This feels harsh. But it is the right call. A crash you can see is a thousand times better than silent data corruption you cannot. The crash tells you exactly what happened and where. Silent corruption might not surface for hours, or days, or ever, until something subtle breaks in production.

Go is saying: I would rather die loudly than lie to you quietly.

## What the fix looks like

The standard fix in Go is a `sync.RWMutex`. It is a lock that lives next to your map. Before any goroutine reads or writes, it asks for permission. Only one writer can hold the lock at a time. Multiple readers can share it simultaneously since reads do not conflict with each other.

```go
var mu sync.RWMutex

// Writing
mu.Lock()
db[key] = value
mu.Unlock()

// Reading
mu.RLock()
val := db[key]
mu.RUnlock()
```

Now goroutines take turns instead of colliding. The map is never touched by two writers at once.

## The thing that surprised me

My server passed the map into each goroutine as a function argument. I assumed that meant each goroutine had its own copy. It does not. Maps in Go are reference types. Passing a map to a function passes a reference to the same underlying data, not a copy of it. Every goroutine was writing to the exact same memory.

This is not a Go quirk. Slices work the same way. Channels work the same way. Any time you pass a reference type to a goroutine, you are sharing memory, and sharing memory means you need to coordinate access.

## What this changed for me

Last week I used `go handleConnection(conn)` and felt clever for getting concurrency with one keyword. This week I learned that `go` is only half the picture. Spinning up goroutines is easy. Keeping them from stepping on each other takes more thought.

The mutex is the other half.
