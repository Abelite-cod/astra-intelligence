import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // ── Shadcn semantic tokens (map to CSS vars)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",       // Amber #C8843A
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ── ASTRA brand palette — warm amber replaces indigo
        // OLD: astra.500 = #6366f1 (Tailwind indigo-500 — REMOVED)
        // NEW: amber scale anchored on #C8843A
        astra: {
          50:  "#FDF6EE",
          100: "#F9E8D0",
          200: "#F2CFA0",
          300: "#E9AF62",
          400: "#DE913A",
          500: "#C8843A",  // PRIMARY ACCENT
          600: "#A86830",
          700: "#864F25",
          800: "#663C1C",
          900: "#4A2A12",
          950: "#2E1A0A",
        },

        // ── Neutral scale — warm charcoal
        neutral: {
          0:   "#FFFFFF",
          50:  "#F5F2EE",   // warm off-white
          100: "#EAE7E2",
          200: "#D5D0C9",
          300: "#B8B2A9",
          400: "#928C83",
          500: "#6E6860",
          600: "#524D47",
          700: "#3A3530",
          800: "#2A2520",
          850: "#1F1B17",
          900: "#161310",
          950: "#0D0B09",
        },
      },

      // ── Border radius — minimal, tool-like
      // OLD: lg: "var(--radius)" = 10px — produced rounded-2xl/3xl everywhere
      // NEW: --radius = 2px — sharp, editorial
      borderRadius: {
        none:    "0",
        sm:      "2px",
        DEFAULT: "3px",
        md:      "4px",
        lg:      "6px",
        xl:      "8px",
        full:    "9999px",
      },

      // ── Font families — DM Sans (mapped to --font-geist-sans) replaces Inter
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },

      // ── Font sizes — editorial scale
      fontSize: {
        "xs":   ["11px", { lineHeight: "16px", letterSpacing: "0.02em" }],
        "sm":   ["13px", { lineHeight: "20px", letterSpacing: "0.01em" }],
        "base": ["15px", { lineHeight: "24px", letterSpacing: "0em" }],
        "lg":   ["17px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        "xl":   ["20px", { lineHeight: "30px", letterSpacing: "-0.01em" }],
        "2xl":  ["24px", { lineHeight: "34px", letterSpacing: "-0.02em" }],
        "3xl":  ["30px", { lineHeight: "40px", letterSpacing: "-0.02em" }],
        "4xl":  ["36px", { lineHeight: "46px", letterSpacing: "-0.03em" }],
        "5xl":  ["48px", { lineHeight: "58px", letterSpacing: "-0.03em" }],
        "6xl":  ["60px", { lineHeight: "70px", letterSpacing: "-0.04em" }],
        "7xl":  ["72px", { lineHeight: "82px", letterSpacing: "-0.04em" }],
      },

      // ── Box shadows — eliminate glow, use real depth only
      // OLD: shadow-astra-500/20, boxShadow: "0 0 40px rgba(99,102,241,0.3)", etc.
      // NEW: clean elevation tiers, no glow/neon variants
      boxShadow: {
        "sm":      "0 1px 2px rgba(0,0,0,0.35)",
        "DEFAULT": "0 1px 3px rgba(0,0,0,0.4)",
        "md":      "0 2px 6px rgba(0,0,0,0.4)",
        "lg":      "0 4px 12px rgba(0,0,0,0.4)",
        "focus":   "0 0 0 2px #C8843A",
        "none":    "none",
      },

      // ── Keyframes — retain structural ones, remove decorative
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        // REMOVED: shimmer (decorative loading pattern)
      },

      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.2s ease-out",
        "slide-in-right":  "slide-in-right 0.25s ease-out",
        // REMOVED: shimmer animation
      },

      // ── Spacing additions for editorial layouts
      spacing: {
        "18": "4.5rem",   // 72px — useful for sidebar items
        "22": "5.5rem",   // 88px — section gap
        "30": "7.5rem",   // 120px — large section padding
      },
    },
  },

  plugins: [
    require("tailwindcss-animate"),
    // Add typography plugin for rich text content areas (knowledge base, chat)
    // require("@tailwindcss/typography"),
  ],
};

export default config;
