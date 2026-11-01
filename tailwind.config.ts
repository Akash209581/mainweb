import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.25rem",
        lg: "2rem",
        "2xl": "2rem"
      },
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      fontFamily: {
        heading: ['"Times New Roman"', "Times", "serif"],
        body: ['"Times New Roman"', "Times", "serif"],
        sans: ['"Times New Roman"', "Times", "serif"],
        serif: ['"Times New Roman"', "Times", "serif"]
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["12px", { lineHeight: "1.6" }]
      },
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        foreground: "rgb(var(--color-text-primary) / <alpha-value>)",
        muted: "rgb(var(--color-text-secondary) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        glow: "rgb(var(--color-glow) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        hover: "rgb(var(--color-hover) / <alpha-value>)"
      },
      boxShadow: {
        glass: "0 20px 70px rgb(var(--color-glow) / 0.18)",
        soft: "0 18px 40px rgb(0 0 0 / 0.22)"
      },
      borderRadius: {
        xs: "0.25rem"
      }
    }
  },
  plugins: []
};

export default config;
