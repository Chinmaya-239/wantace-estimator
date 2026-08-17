/**
 * Design tokens for Northline Roofing & Exteriors.
 *
 * Direction: a working contractor's tool, not a SaaS marketing site.
 * Palette leans on weathered copper (the patina roofing copper turns
 * after years on a house) and a brick-clay red, on a cool stone-fog
 * background — deliberately avoiding the default warm-cream/terracotta
 * combination. Fraunces (a slightly irregular, crafted serif) carries
 * headlines; Inter runs the dense form/table UI; JetBrains Mono sets
 * every measurement and dollar figure, so numbers read like they came off
 * a measuring tape or a printed estimate slip.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C2624",
        fog: "#EEF1ED",
        card: "#FFFFFF",
        patina: {
          DEFAULT: "#4F7566",
          dark: "#3B5A4D",
          light: "#E4ECE7",
        },
        brick: {
          DEFAULT: "#A5402B",
          dark: "#823221",
          light: "#F5E4DF",
        },
        slate: {
          DEFAULT: "#38443F",
          soft: "#6B7A73",
        },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 38, 36, 0.06), 0 8px 24px -12px rgba(28, 38, 36, 0.18)",
      },
    },
  },
  plugins: [],
};
