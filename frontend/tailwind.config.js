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
          "red-muted": "rgba(200, 16, 46, 0.15)",
        },
        slate: {
          950: "#0a0e14",
          925: "#0d1219",
          900: "#111827",
          875: "#151c27",
        },
        zinc: {
          925: "#18181b",
          900: "#212124",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderColor: {
        slate: "#1e293b",
      },
      boxShadow: {
        "thy-glow": "0 0 20px rgba(200, 16, 46, 0.15)",
      },
    },
  },
  plugins: [],
};
