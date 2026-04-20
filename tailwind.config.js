/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3a5f94",
        "primary-container": "#d5e3ff",
        "on-primary": "#ffffff",
        surface: "#ffffff",
        "on-surface": "#1a1c1e",
        "surface-variant": "#dee3eb",
        "on-surface-variant": "#44474e",
        outline: "#74777f",
        "surface-dim": "#d9d9e0",
        "surface-bright": "#f9f9fc",
        "surface-container-low": "#f3f3f7",
        "surface-container-highest": "#e2e2e6",
        secondary: "#005dbd",
        "secondary-container": "#d8e2ff",
        "on-secondary-container": "#001a41",
        "tertiary-container": "#b6ebff",
        "tertiary-fixed-dim": "#006780",
        "on-tertiary-container": "#001f28",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#410002",
        "on-error": "#ffffff",
        background: "#ffffff",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}

