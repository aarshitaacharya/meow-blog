---
title: "My first week of Go: building a tiny TCP server"
description: "How I built a TCP server in Go from scratch and what actually made things click."
date: 2026-06-24
tags: ["go", "tcp"]
draft: false
---

_A beginner's notes on writing a small TCP server in Go — what confused me, what clicked, and the one keyword that let it talk to more than one person at a time._

I spent this week learning Go by building a small TCP server. Nothing big — just something that listens on a port and talks back. Here is what I picked up, in plain terms.

## Writing the comments first

The rule I followed was simple: write the English first, then the code. So before I touched any Go, I wrote the steps down as plain comments.

`// Open a TCP server on port 6379`

`// Loop forever and accept connections`

`// Read the bytes that come in`

`// Print them`

It felt slow at first. But once the steps were sitting there in order, the code was almost just filling in the blanks. Most of my confusion was never about Go — it was not being clear on **what** I wanted to happen.

## A server is just a loop

The thing that surprised me most: a TCP server is not complicated. It is three moves on repeat.

You **listen** on a port. You **accept** a connection. You **read** the bytes. Then you go back and do it again.

```
listener, err := net.Listen("tcp", "localhost:6379")

for {
    conn, err := listener.Accept()
    go handleConnection(conn)
}
```

That `for` loop with no condition just means "keep going forever," waiting for the next person to connect. (Side note I liked: port `6379` is the one Redis uses, which is the kind of thing I am slowly building toward.)

## The one keyword: `go`

On day one my server could only deal with one person at a time. If a second client connected, it had to wait its turn. The fix was a single word in front of the function call:

`go handleConnection(conn)`

That `go` runs the function on its own little track — a _goroutine_ — so the main loop is free to go straight back and accept the next person. No waiting.

> I did not really get this until I opened three terminals and watched all three get a reply at the same time. Reading about it did nothing. Seeing it did everything.

## A tiny protocol

The last piece was teaching the server to understand a command. Send it `PING`, it replies `PONG`. Send it anything else, it answers `ERR Unknown Command`.

That is it. But it was the first time the program felt like it was having a conversation instead of just echoing noise back at me.

## What I am taking with me

Two things stuck. First, **writing the plain-English steps before the code** saved me more than any syntax trick. Second, a lot of scary-sounding ideas — servers, concurrency — turned out to be small once I actually built them. One loop, one keyword, and it worked.
