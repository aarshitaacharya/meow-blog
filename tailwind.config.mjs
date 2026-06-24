/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx,vue,svelte}"],
  theme: {
    extend: {
      /* ── Palette pulled straight from the cat-UI sprite sheet ── */
      colors: {
        cat: {
          // surfaces
          cream: "#f7ecdd",
          parchment: "#f3e2cb",
          tan: "#e8c9a3",
          biscuit: "#d9a878",
          // accents
          pink: "#f4cdc6",
          rose: "#e7a59b",
          sky: "#bcd7e3",
          blue: "#9cc0d4",
          // ink / outlines / text
          ink: "#3a2c24",
          cocoa: "#6b4f3d",
          mocha: "#8a6a4f",
          // utility
          mint: "#cfe6cf",
          butter: "#f6e2a8",
        },
      },

      fontFamily: {
        // The display face is the pixel font; body stays readable.
        pixel: ['"Press Start 2P"', '"VT323"', "ui-monospace", "monospace"],
        body: ['"Quicksand"', "ui-rounded", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },

      /* Chunky, friendly corners */
      borderRadius: {
        chunk: "14px",
        blob: "22px",
        pill: "999px",
      },

      borderWidth: {
        3: "3px",
        5: "5px",
      },

      /* Hard (no-blur) retro drop shadows — the "heavy shadow" look */
      boxShadow: {
        "retro-sm": "3px 3px 0 0 #3a2c24",
        retro: "5px 5px 0 0 #3a2c24",
        "retro-lg": "8px 8px 0 0 #3a2c24",
        "retro-pink": "5px 5px 0 0 #e7a59b",
        "retro-blue": "5px 5px 0 0 #9cc0d4",
        // soft inner highlight to fake the beveled sprite edge
        bevel: "inset 0 3px 0 0 rgba(255,255,255,0.55), inset 0 -3px 0 0 rgba(58,44,36,0.12)",
        press: "2px 2px 0 0 #3a2c24",
      },

      /* A handful of pixel-friendly spacing steps */
      spacing: {
        4.5: "1.125rem",
        13: "3.25rem",
        18: "4.5rem",
        22: "5.5rem",
      },

      keyframes: {
        wiggle: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "paw-press": {
          "0%": { transform: "translate(0,0)" },
          "100%": { transform: "translate(2px,2px)" },
        },
        twinkle: {
          "0%,100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        wiggle: "wiggle 0.5s ease-in-out infinite",
        float: "float 3.5s ease-in-out infinite",
        twinkle: "twinkle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
