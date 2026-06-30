---
title: "Not all your code deserves a clever lock"
description: "Most concurrency bugs come from optimizing code that never needed to be fast in the first place."
date: 2026-06-30
tags: ["go", "systems", "concurrency"]
draft: false
---

I read a paper this week by Bryan Cantrill and Jeff Bonwick called "Real-World Concurrency." One idea from it changed how I think about my own server: not all code is equally important, and treating it like it is leads to bugs for no reason.

## The two kinds of code

Every program has two kinds of paths.

**Hot paths** run constantly. In my key-value server, this is `GET` and `SET`. Every single client connection hits this code, over and over, thousands of times a second under load. This is where speed actually matters.

**Cold paths** run rarely. Starting the server. Reading a config file. Logging an error when something goes wrong. These run once, or occasionally, and nobody notices if they take an extra microsecond.

## The mistake

The instinct when you learn about fine-grained locking, lock-free data structures, or clever atomic tricks is to use them everywhere. It feels like good engineering. More performance, more often, must be better.

But here is the problem. A complicated lock-free structure is harder to write correctly. It is harder to debug when it breaks. And if you put that complexity on a cold path, you paid the full cost in bugs and got zero benefit, because that code barely runs.

Imagine I rewrote the part of my server that parses the startup config file using some elaborate lock-free queue, just because I had learned the technique. That code runs once, when the server boots. Speeding it up from 2 microseconds to 0.2 microseconds means nothing to anyone. But the complexity I added is now a permanent source of risk every time I touch that file.

## The rule

Cantrill's advice is blunt: use the simplest possible synchronization on cold paths. A big dumb global lock is fine there. Nobody is fighting over it because almost nothing happens there.

Save the careful, fine-grained, fast concurrency designs for the hot path, and only after you have actual evidence that the hot path needs it.

## How this applies to my server

My `GET` and `SET` commands are hot paths. They run on every client request, so the `sync.RWMutex` I benchmarked last week matters there. Shaving nanoseconds off something that runs 260 million times adds up.

But my error-handling code, the part that prints `"Error accepting connections"` when something goes wrong with the listener, is a cold path. It barely runs. If I spent a week trying to make that line of code lock-free, I would have wasted a week and probably introduced a bug, for a piece of code that fires maybe once a month.

## The takeaway

Before reaching for a clever concurrency trick, ask where the code actually sits. If it runs constantly under load, the complexity might be worth it. If it runs once at startup or only when something breaks, keep it boring. Simple code on a cold path is not laziness. It is the correct tradeoff.
