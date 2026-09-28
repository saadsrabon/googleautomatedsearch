import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0f172a", muted: "#64748b" },
        accent: { DEFAULT: "#2563eb", soft: "#dbeafe" },
      },
    },
  },
  plugins: [],
};
export default config;
