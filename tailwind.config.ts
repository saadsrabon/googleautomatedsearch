import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "cyber-display": ["var(--font-cyber-display)", "system-ui", "sans-serif"],
        "cyber-mono": ["var(--font-cyber-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: { DEFAULT: "#0f172a", muted: "#64748b" },
        accent: { DEFAULT: "#2563eb", soft: "#dbeafe" },
        neon: {
          cyan: "#22d3ee",
          magenta: "#e879f9",
          void: "#070b14",
        },
      },
      boxShadow: {
        neon: "0 0 20px rgba(34, 211, 238, 0.35)",
        "neon-fuchsia": "0 0 20px rgba(232, 121, 249, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
