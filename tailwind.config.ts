import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#161815",
        paper: "#f3f4f0",
        linen: "#e5e8e1",
        clay: "#315843",
        moss: "#315843",
        graphite: "#30332f",
        cobalt: "#3856c8"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      boxShadow: {
        line: "0 1px 0 rgba(22, 24, 21, 0.10)",
        lift: "0 16px 40px rgba(22, 24, 21, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
