/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5F3F0",
        sage: "#9CAF88",
        terracotta: "#C97C5C",
        blue: "#8BB5D6",
        dustyBlue: "#8BB5D6",
        charcoal: "#3A3A3A",
        white: "#FFFFFF",
        muted: "#FBFAF8",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #F5F3F0 0%, #E8E1DA 100%)",
        "sage-gradient": "linear-gradient(135deg, #A8B8A8 0%, #9CAF88 100%)",
        "terracotta-gradient": "linear-gradient(135deg, #D4844E 0%, #C97C5C 100%)",
        "blue-gradient": "linear-gradient(135deg, #8BB5D6 0%, #7A9FB8 100%)",
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
};
