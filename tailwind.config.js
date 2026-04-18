/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1978e5",
        "primary-container": "#d6e3ff",
        "on-primary": "#ffffff",
        surface: "#f9f9ff",
        "on-surface": "#181c22",
        "surface-variant": "#e0e2ec",
        "on-surface-variant": "#414753",
        outline: "#717785",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}

