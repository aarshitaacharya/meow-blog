# 🐾 meow.log — a cutesy retro dev blog

A pixel-art technical blog that runs **100% free** on GitHub Pages, rebuilds
itself with **GitHub Actions**, and lets you publish posts **straight from the
browser** via the GitHub API.

- **Astro** static site generation
- **Tailwind** with a custom pastel/retro token system (`tailwind.config.mjs`)
- **Shiki** code highlighting (`catppuccin-latte`)
- **`/admin`** in-browser content manager that commits Markdown to your repo
- **`deploy.yml`** auto-builds on every push to `main`

---

## 1. Quick start (local)

```bash
npm install
npm run dev      # http://localhost:4321/meowblog/
npm run build    # outputs static files to /dist
```

## 2. Point it at your repo

Open **`astro.config.mjs`** and set two values:

```js
const SITE = "https://YOUR_USERNAME.github.io";
const BASE = "/YOUR_REPO/";   // KEEP the trailing slash. Use "/" for a <user>.github.io repo
```

> ⚠️ The trailing slash on `BASE` matters. `BASE_URL` must end in `/` so asset
> paths like `${BASE_URL}ui/paw.png` resolve correctly.

## 3. Push to GitHub & turn on Pages

1. Create a repo, push this code to the **`main`** branch.
2. The workflow in `.github/workflows/deploy.yml` runs automatically, builds the
   site, and pushes the output to a **`gh-pages`** branch.
3. In **Settings → Pages**, set **Source = Deploy from a branch**, branch
   **`gh-pages`**, folder **`/ (root)`**. Save.
4. Your site goes live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

## 4. Make a publishing token (for `/admin`)

1. GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. **Repository access:** *Only select repositories* → pick this one repo.
3. **Permissions → Repository permissions → Contents → Read and write.**
4. Generate, copy the `github_pat_...` string.

## 5. Publish a post from the live site

1. Visit `https://YOUR_USERNAME.github.io/YOUR_REPO/admin`.
2. Fill in **owner / repo / branch / token**, click **save settings** then
   **test connection** (should say *connected ✓*).
3. Write a post, hit **🚀 Publish post**. It commits a `.md` file to
   `src/content/blog/`, which triggers the deploy. Your post is live in ~1–2 min.

> 🔒 **Security:** the token lives only in your browser's `localStorage` and
> grants write access to the repo. Use a fine-grained, single-repo token, and
> never enter it on a shared computer. Click **forget token** when done on a
> device you don't control.

---

## Swapping in your own sprites

Placeholder crops live in `public/ui/`. Replace any of them with your own
same-named PNGs and the theme re-skins itself. To use a true 9-slice border,
export a tileable panel as `public/ui/panel-9slice.png` and add the
`frame--sprite` class to any `.frame` (see `src/styles/global.css`).

## Project layout

```
.github/workflows/deploy.yml   CI/CD: build + deploy to gh-pages
astro.config.mjs               site/base + Shiki theme
tailwind.config.mjs            pastel/retro design tokens
public/ui/                     cropped pixel sprites
src/styles/global.css          retro CSS frames + markdown styling
src/layouts/BaseLayout.astro   the centered pixel-window wrapper
src/components/                Panel, CatPanel, RetroButton, Callout, …
src/content/blog/              your posts (*.md / *.mdx)
src/pages/admin.astro          the browser-based GitHub publisher
src/pages/blog/[...slug].astro post renderer
```

Made with ♥ and pixels.
