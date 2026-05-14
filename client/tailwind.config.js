/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./hooks/**/*.{js,jsx}",
    "./utils/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        panel: "var(--color-panel)",
        panelSoft: "var(--color-panel-soft)",
        textPrimary: "var(--color-text-primary)",
        textMuted: "var(--color-text-muted)",
        accent: "var(--color-accent)",
        accentSoft: "var(--color-accent-soft)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
        satoshi: ["Satoshi", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".7" },
        },
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        floatIn: "floatIn .45s ease-out both",
      },
      boxShadow: {
        panel: "0 20px 45px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
