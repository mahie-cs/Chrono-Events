import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        fg: "var(--fg)",
        mut: "var(--mut)",
        line: "var(--line)",
        glass: "var(--glass)",
        "glass-edge": "var(--glass-edge)",
        sel: "var(--sel)",
        up: "var(--up)",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", '"SF Pro Text"', "sans-serif"],
      },
      boxShadow: {
        glass: "var(--shadow)",
      },
    },
  },
  plugins: [],
};

export default config;
