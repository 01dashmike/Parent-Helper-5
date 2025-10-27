import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fffaf3",
        teal: "#14b8a6",
        "teal-dark": "#0f766e",
        coral: "#fb7185",
        sage: "#64748b",
        lavender: "#c4b5fd",
        amber: "#fbbf24",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
