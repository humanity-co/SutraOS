/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
          hover: '#334155',
        },
        accent: {
          DEFAULT: '#3b82f6',
          light: '#eff6ff',
          hover: '#2563eb',
        },
        success: {
          DEFAULT: '#10b981',
          bg: '#ecfdf5',
        },
        warning: {
          DEFAULT: '#f59e0b',
          bg: '#fffbeb',
        },
        danger: {
          DEFAULT: '#ef4444',
          bg: '#fef2f2',
        },
        info: {
          DEFAULT: '#0ea5e9',
          bg: '#f0f9ff',
        },
      }
    },
  },
  plugins: [],
}
