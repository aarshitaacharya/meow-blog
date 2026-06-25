---
title: "How Redis handles a million connections without breaking a sweat"
description: "Redis is single-threaded. It should be slow. It is not. Here is why."
date: 2026-06-25
tags: ["redis", "systems"]
draft: false
---

The first thing that confuses people about Redis is this: it runs on one thread. No parallelism. One chef in the kitchen. And yet it is famously fast. How?

The answer is in how it is designed, not how much muscle it has.

## The kitchen analogy

Think of Redis as a restaurant kitchen with one chef and a very good system.

The chef never wanders around asking tables if they need anything. Instead, everything uses a signal. A door bell rings when a new customer arrives. An order flag goes up when someone is ready to order. A heat rack holds finished plates until the server can carry them out. The chef just stands at the grill, reacting to signals, never waiting around.

That is the **event loop** (`ae.c` in the Redis source). It is the core engine. It watches all the open connections at once and only acts when something actually happens. No polling. No waiting. Just signals.

## What happens when you connect

When you connect to Redis, the listening socket (the door bell) picks it up. Redis immediately creates a `client` struct for you in memory, basically a notepad with your name on it. It tracks your state, your current command, your output, everything about your session.

> Think of it as Redis pulling out a fresh notepad the moment you walk in. That notepad exists until you leave.

## What happens when you send a command

When you type `PING` and hit enter, a **read event** fires. Redis sees the flag, calls `readQueryFromClient`, and reads the raw bytes off the network into your query buffer. It then parses it, runs the command, and writes the response into your **output buffer**, not straight back to you.

That last part matters. Writing directly to a slow network connection would stall the chef. Instead Redis puts the response on a heat rack (the output buffer) and keeps moving.

## The final sweep

At the end of each event loop cycle, Redis does one batch pass through all clients that have something waiting in their output buffer. This is `handleClientsWithPendingWrites`. It flushes everything out in one go.

```
Event comes in
  -> read command
  -> run command
  -> write response to output buffer
  -> keep going

End of loop cycle
  -> flush all output buffers to clients at once
```

This is why Redis stays fast even under load. The chef never stops to hand-deliver a plate. Everything goes on the rack and gets cleared in one sweep.

## The one surprise from the source code

I skimmed `networking.c` in the Redis source and the thing that stood out was the sheer number of edge cases around reading from the network. Partial reads, oversized queries, clients that send data too fast. A lot of the code is not the happy path, it is handling everything that can go wrong between two machines talking over a wire.

Also, modern Redis does bring in helper threads for that final output flush step, specifically to carry the heavy trays to the tables without pulling the chef away from the grill. The core logic stays single-threaded. The slow network I/O gets offloaded. Best of both worlds.

## Why this matters

Understanding this made the Go TCP server I built last week feel like a toy model of Redis. My server uses goroutines to handle multiple clients, one goroutine per connection. Redis does the same job with one thread and a smarter loop. Neither is wrong for what it is. But seeing the real thing makes the tradeoffs obvious.

One thread, no locks, no coordination overhead. Just a tight loop reacting to signals. That is the whole trick.
