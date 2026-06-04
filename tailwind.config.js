/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        aerospace: {
          dark: "#0a0e27",
          darker: "#050810",
          panel: "#1a1f3a",
          accent: "#00d9ff",
          "accent-light": "#00f3ff",
          success: "#00ff88",
          warning: "#ffaa00",
          danger: "#ff3333",
          secondary: "#6366f1",
        },
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { "box-shadow": "0 0 5px rgba(0, 217, 255, 0.5)" },
          "50%": { "box-shadow": "0 0 20px rgba(0, 217, 255, 0.8)" },
        },
      },
      boxShadow: {
        glow: "0 0 10px rgba(0, 217, 255, 0.5)",
        "glow-lg": "0 0 20px rgba(0, 217, 255, 0.8)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
