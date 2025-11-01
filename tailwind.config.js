import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "Inter", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
        sans: ["var(--font-poppins)", "sans-serif"],
        display: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        primary: "#FF6F61",
        secondary: "#FFD93D",
        accent: "#FFB347",
        success: "#6BCB77",
        info: "#4D96FF",
        neutral: "#F5F5F5",
        text: "#1E1E1E",
        cream: "#FFF8F3",
        slateSoft: "#374151",
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, #FFD6A5 0%, #FFAAA5 100%)",
        "gradient-button": "linear-gradient(90deg, #FF6B6B 0%, #FFD93D 100%)",
        "gradient-card": "linear-gradient(135deg, #FFE8CC 0%, #FFF8E1 100%)",
        "gradient-footer": "linear-gradient(to right, #FFDAB9, #FFB6C1, #C8E6C9)",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.05)",
        glow: "0 0 12px rgba(255,107,107,0.3)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme("colors.slateSoft"),
            a: {
              color: theme("colors.accent"),
              textDecoration: "none",
              fontWeight: "600",
              "&:hover": {
                textDecoration: "underline",
              },
            },
            h1: {
              color: theme("colors.slateSoft"),
              fontWeight: "700",
            },
            h2: {
              color: theme("colors.slateSoft"),
              fontWeight: "600",
            },
            h3: {
              color: theme("colors.slateSoft"),
              fontWeight: "600",
            },
            strong: {
              color: theme("colors.slateSoft"),
              fontWeight: "700",
            },
            code: {
              backgroundColor: theme("colors.cream"),
              color: theme("colors.accent"),
              padding: "2px 6px",
              borderRadius: "6px",
              fontSize: "0.9em",
            },
            blockquote: {
              borderLeftColor: theme("colors.accent"),
              backgroundColor: theme("colors.cream"),
              padding: "0.75rem 1rem",
              borderRadius: "8px",
            },
          },
        },
      }),
    },
  },
  plugins: [tailwindcssAnimate, typography],
};
