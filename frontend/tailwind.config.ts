import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        slate: "#334155",
        mist: "#F1F5F9",
        ember: "#A63A1D",
        sand: "#F8F3EB",
        mint: "#0F766E",
        gold: "#D97706",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at center, rgba(15, 118, 110, 0.16) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
