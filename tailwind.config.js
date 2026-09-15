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
        kinora: {
          navy: '#061F5C',
          'navy-dark': '#03194A',
          'navy-deep': '#021033',
          royal: '#073B9E',
          blue: '#0869E8',
          bright: '#168BFF',
          cyan: '#16C7F2',
          teal: '#19C9A7',
          mint: '#55D98A',
          lime: '#B9F36B',
          yellow: '#FFD21F',
          gold: '#FFB91F',
          orange: '#FF8A24',
          'warm-orange': '#FF6F32',
          danger: '#FF4D6D',
          white: '#FFFFFF',
          'soft-white': '#F4F8FF',
          'text-secondary': '#B9D8FF',
          'text-muted': '#91A8C7',
          'text-tagline': '#7EDCFF',
          'text-quote': '#A9DFFF',
        },
        primary: {
          50: '#F0F5FF',
          100: '#E0EBFF',
          200: '#C7D9FE',
          300: '#A4BFFD',
          400: '#7B9BFC',
          500: '#4F6BF5',
          600: '#2D44E6',
          700: '#1E2CB8',
          800: '#1B2490',
          900: '#0F172A',
          950: '#090D1A',
        },
        gold: {
          50: '#FFFDF0',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
        },
        teal: {
          50: '#F0FDFA',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(6, 31, 92, 0.4), 0 2px 6px -1px rgba(6, 31, 92, 0.3)',
        'premium': '0 10px 30px -4px rgba(6, 31, 92, 0.5), 0 4px 12px -2px rgba(6, 31, 92, 0.3)',
        'glow': '0 0 25px -5px rgba(22, 139, 255, 0.35)',
        'kinora-wealth': '0 8px 30px rgba(22, 139, 255, 0.20)',
        'kinora-plus': '0 8px 30px rgba(22, 139, 255, 0.35)',
        'kinora-active-nav': '0 0 16px rgba(255, 210, 31, 0.25)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}
