/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: {
          950: "#0A0912", // background (60%)
          900: "#0E0C1A", // sidebar
          800: "#15132A", // containers (30%)
          700: "#1E1B36", // rows, inputs
          600: "#2A2647", // hover
        },
        volt: {
          DEFAULT: "#9333EA", // accent (10%)
          light: "#C4B5FD", // accent text
        },

        slate: {
          400: "#94a3b8",
          300: "#cbd5e1",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        waveform: "waveform 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        waveform: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
    fontFamily: {
      display: ["Inter", "system-ui", "sans-serif"],
      body: ["Inter", "system-ui", "sans-serif"],
      mono: ["JetBrains Mono", "ui-monospace", "monospace"],
    },
  },
  plugins: [],
};
