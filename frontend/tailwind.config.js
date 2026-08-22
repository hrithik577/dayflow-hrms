/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#bae0ff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#0f172a',
        },
        navy: {
          800: '#0b1329',
          900: '#070d1e',
          950: '#040711'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
