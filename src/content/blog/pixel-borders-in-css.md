---
title: "Faking 9-slice pixel borders with pure CSS"
description: "How the panels here render as game-GUI frames before any sprite loads."
date: 2026-06-22
tags: ["css", "tailwind", "tutorial"]
draft: false
---

The frames on this site use a layered trick so they look like sliced pixel art
*without* needing an image at all.

## The hard drop-shadow

A retro UI shadow has **no blur** and a chunky offset:

```css
.frame {
  border: 3px solid #3a2c24;
  border-radius: 14px;
  box-shadow: 5px 5px 0 0 #3a2c24; /* the magic: 0 blur */
}
```

## The fake bevel

A pseudo-element adds an inner highlight so the panel reads as 3D:

```css
.frame::after {
  content: "";
  position: absolute;
  inset: 3px;
  box-shadow:
    inset 0 3px 0 0 rgba(255,255,255,0.6),
    inset 0 -4px 0 0 rgba(58,44,36,0.1);
}
```

When you're ready, swap in a real sprite by adding `frame--sprite`, which uses
`border-image` for a true 9-slice.

That's the whole secret — three rules and you've got a cozy little window.
