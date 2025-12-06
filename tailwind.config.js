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
      fontSize: {
        "display-1": ["3rem", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" }], // 48px
        "display-2": ["2.25rem", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.01em" }], // 36px
        "title": ["1.5rem", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.01em" }], // 24px
        "body": ["1.0625rem", { lineHeight: "1.625", fontWeight: "400" }], // 17px - matches base font size
        "small": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }], // 14px
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        cream: {
          DEFAULT: "#F5F3F0",
          light: "#E7E5E0",
          lighter: "#E8E5E0",
          soft: "#E8E1DA",
        },
        sage: {
          DEFAULT: "#9CAF88",
          light: "#A8B8A8",
          dark: "#7C8F67", // WCAG-compliant for white text (3.8:1)
          darker: "#7F9065",
          // Alternative sage variant used in some admin components
          alt: "#9BAE82",
          // Additional sage variants for charts
          lighter: "#B8C9A8",
          lightest: "#8FA97C",
        },
        forest: "#6B8E5A",
        terracotta: "#C97C5C",
        blue: "#8BB5D6",
        dustyBlue: "#8BB5D6",
        charcoal: {
          DEFAULT: "#3A3A3A",
          dark: "#3D3D3D",
          darker: "#444444",
        },
        white: "#FFFFFF",
        muted: "#FBFAF8",
        border: {
          light: "#DAD7D0",
        },
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
        // Custom radius tokens
        "sm": "0.125rem",      // 2px - for small elements
        "card": "0.375rem",    // 6px - for cards and containers (replaces md/lg)
        "surface": "0.75rem",  // 12px - for surfaces and dialog boxes (replaces xl)
        "hero": "1.5rem",      // 24px - for hero sections (replaces 2xl+)
        "dialog": "0.75rem",   // 12px - for dialog containers (same as surface)
      },
      padding: {
        "dialog": "1.5rem",      // 24px - for dialog container padding
        "dialog-header": "1.5rem 1.5rem 1rem",  // 24px horizontal, 16px bottom
        "dialog-body": "1.5rem",   // 24px - for dialog body padding
        "dialog-footer": "1rem 1.5rem",  // 16px top, 24px horizontal
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
};
