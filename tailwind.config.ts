import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          glow: "#8b5cf6",
        },
        bubble: {
          light: "#f3f4f6",
          lightBorder: "#e5e7eb",
          dark: "#1e1b2e",
          darkBorder: "#2e2a45",
          accent: "#6366f1",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'glow': '0 0 20px -3px rgba(99, 102, 241, 0.4)',
        'bubble': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'float': '0 12px 30px -5px rgba(0, 0, 0, 0.2)',
      },
      keyframes: {
        heartPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.25)' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        }
      },
      animation: {
        'heart-pulse': 'heartPulse 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'float-up': 'floatUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
};
export default config;
