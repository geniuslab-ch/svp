import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0A09",
          900: "#10100E",
          850: "#151513",
          800: "#1B1B18",
          750: "#22221E",
          700: "#2B2B26",
          600: "#3A3A33",
        },
        ivory: {
          DEFAULT: "#F1ECE2",
          100: "#F1ECE2",
          200: "#D9D3C7",
          300: "#B3AD9F",
          400: "#8A8578",
          500: "#66625A",
        },
        lime: {
          DEFAULT: "#C8F04B",
          300: "#DAF77F",
          400: "#C8F04B",
          500: "#A9CF2E",
          900: "#22290D",
        },
        clay: "#E07A5F",
        amber: "#E6B655",
        sage: "#8FB39A",
        steel: "#7F95B5",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        serif: ["'Instrument Serif'", "ui-serif", "Georgia", "serif"],
      },
      fontSize: {
        "display-xl": ["clamp(3rem, 8vw, 7.5rem)", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "0.98", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(1.9rem, 3.4vw, 2.9rem)", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
      },
      borderRadius: { card: "14px" },
      boxShadow: {
        lift: "0 1px 0 0 rgba(241,236,226,0.04) inset, 0 30px 60px -30px rgba(0,0,0,0.8)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
