---
title: "Hello, World (from a sleeping cat)"
description: "Spinning up a cutesy retro dev blog that lives entirely on GitHub Pages."
date: 2026-06-20
tags: ["meta", "astro", "pixel-art"]
draft: false
---

Welcome to **meow.log** — a tiny technical blog that runs on GitHub
Pages, builds itself with GitHub Actions, and lets me publish new posts straight
from the browser.

> Every panel, button, and divider you see is a pixel sprite (with a pure-CSS
> fallback underneath), so the whole thing degrades gracefully.

## Why this stack?

- **Astro** ships zero JS by default, so pages load fast.
- **Tailwind** holds all the pastel tokens in one config.
- **Shiki** colors the code blocks to match the palette.

```js
// a wild code block appears
function greet(cat) {
  return `meow, ${cat.name}! zzz...`;
}

console.log(greet({ name: "biscuit" }));
```

That's it. Go pet a cat.
