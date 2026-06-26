---
title: "TCP gives you bytes. RESP gives you meaning."
description: "Why raw bytes are not enough, and how Redis solved message framing with a dead simple protocol."
date: 2026-06-26
tags: ["redis", "protocols"]
draft: false
---

Previously, I built a TCP server. It could accept connections, read bytes, and write bytes back. It worked. But there was a quiet problem hiding in it that I did not fully appreciate until this week.

TCP only promises one thing: the bytes you send will arrive, in order, without getting lost. That is it. TCP has no idea where one message ends and the next one begins. If I send `PING` twice, TCP sees `PINGPING`. Eight bytes. No separator. No boundary. Just a stream.

This is called the **framing problem**. And every protocol that runs on top of TCP has to solve it.

## Why splitting on spaces or newlines breaks fast

My server from last week checked if the incoming string was exactly `"PING"`. That worked because `PING` is one word with no spaces or newlines inside it.

Now imagine you want to store a user bio in a key-value store.

- Key: `user:101`
- Value: `i love coding and\n swimming`

A naive approach sends it like this:

`SET user:101 i love coding and\n swimming`

The server has no idea where the value starts, where it ends, or whether that `\n` in the middle means the command is over or is part of the data. You could try quoting the value, or escaping the newline, but now your parser is getting complicated and fragile. This is the mess every protocol is trying to avoid.

## What RESP is

Redis solved this with RESP (REdis Serialization Protocol). The goals were simple: fast for computers to parse, readable enough for a human to debug with `nc`.

The core idea is that every message starts with a **prefix byte** that tells the parser exactly what type of data is coming next. No guessing. No scanning for delimiters inside your data. Just read the first byte and you already know what to do.

> RESP is not clever. It is just strict. And strictness is what makes it fast.

Today I looked at two types: Simple Strings and Bulk Strings. They solve different problems.

## Simple Strings

Simple Strings are for short status replies that will never contain a newline inside them. Things like `OK` or `PONG`.

```
+OK\r\n
```

The `+` tells the parser a Simple String is coming. It reads until it hits `\r\n` and that is the whole string. Done.

Redis uses `\r\n` (carriage return + newline) instead of just `\n` as the line terminator. It is a strict network convention and every RESP parser expects it.

Simple Strings are fast precisely because they are limited. No length to track, no memory to pre-allocate. Just scan for `\r\n` and you are done. The tradeoff is they cannot hold binary data or newlines.

## Bulk Strings

Bulk Strings are the workhorse. They can hold anything: spaces, newlines, binary data, an entire file. They do it with a technique called **length-prefixing**.

Before sending the actual data, you send the byte count. The parser reads the number first, allocates exactly that much memory, and then reads exactly that many bytes without caring what is inside them.

```
$5\r\nhello\r\n
```

The `$` says a Bulk String is coming. `5` is the length. Then `hello` is the data. Then `\r\n` to close it off.

Walk through what the parser does:

1. Sees `$`. Knows a Bulk String is coming.
2. Reads up to `\r\n`, gets the number `5`.
3. Allocates 5 bytes of memory.
4. Reads exactly 5 bytes into that memory. Does not look at them. Does not care what they contain.
5. Consumes the trailing `\r\n`. Done.

That messy bio from earlier becomes completely unambiguous:

```
$27\r\ni love coding and\n swimming\r\n
```

The server reads 27 bytes and stops. The `\n` inside the value is just byte number 18. Nothing special. The protocol never needed to understand the data, just count it.

## The thing that clicked for me

The insight is that RESP does not try to make the data safe. It does not escape characters or wrap things in quotes. It just tells the parser how many bytes to expect, so the parser never has to look inside the data at all.

Length-prefixing is the trick behind almost every binary protocol you will encounter. HTTP chunked encoding does it. MessagePack does it. Protocol Buffers do it. Once you see it here in RESP, you will recognize it everywhere.
