/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070A09',
          900: '#0B0F0E',
          800: '#141C19',
          700: '#1B2622',
        },
        sage: {
          300: '#A2E3C4',
          400: '#86C2A5',
          500: '#689D84',
          600: '#4D7C66',
        },
        warmgold: {
          400: '#E5C099',
          500: '#D4A373',
          600: '#B88252',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
