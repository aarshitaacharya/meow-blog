import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

const SITE = "https://aarshitaacharya.github.io";
const BASE = "/meow-blog/"; // use "/" if this is a <username>.github.io repo

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: "ignore",
  integrations: [
    tailwind({ applyBaseStyles: false }), // we ship our own base layer in global.css
    mdx(),
    sitemap(),
  ],
  markdown: {
    // Shiki ships with Astro — catppuccin-latte is a bundled pastel theme
    // that meshes with the cutesy palette. Swap to "rose-pine-dawn" or a
    // custom theme JSON for "fairyfloss" if you prefer.
    shikiConfig: {
      theme: "catppuccin-latte",
      wrap: true,
    },
  },
});
