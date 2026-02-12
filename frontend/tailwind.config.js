/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        thy: {
          red: "#C8102E",
          "red-hover": "#A80D26",
          "red-muted": "rgba(200, 16, 46, 0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderColor: {
        slate: "#e2e8f0",
      },
      boxShadow: {
        "thy-glow": "0 0 20px rgba(200, 16, 46, 0.15)",
      },
    },
  },
  plugins: [],
};
