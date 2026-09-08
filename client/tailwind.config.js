/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        user1: {
          light: '#fce7f3',
          border: '#f472b6',
          text: '#be185d',
          bg: '#ec4899',
        },
        user2: {
          light: '#e0f2fe',
          border: '#38bdf8',
          text: '#0369a1',
          bg: '#0284c7',
        },
        overlap: {
          light: '#ecfdf5',
          border: '#34d399',
          text: '#047857',
          bg: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
