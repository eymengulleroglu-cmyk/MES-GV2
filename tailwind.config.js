/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        anthracite: {
          50: "#f4f5f7",
          100: "#e8eaee",
          200: "#cfd3db",
          300: "#a9b0bc",
          400: "#7d8696",
          500: "#5a6373",
          600: "#454d5c",
          700: "#333a47",
          800: "#222831",
          900: "#151922",
          950: "#0b0e14",
        },
        lime: {
          50: "#f7fee7",
          100: "#ecfccb",
          200: "#d9f99d",
          300: "#bef264",
          400: "#a3e635",
          500: "#84cc16",
          600: "#65a30d",
          700: "#4d7c0f",
          800: "#3f6212",
          900: "#365314",
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
        glow: "0 0 0 3px rgba(132,204,22,0.25)",
      },
    },
  },
  plugins: [],
};