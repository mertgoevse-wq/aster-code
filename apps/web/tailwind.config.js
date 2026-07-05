/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FAF9F6',   // Ultra clean ivory
          100: '#F5F2EC',  // Soft background card
          200: '#EBE5DC',  // Muted border / background highlight
          300: '#DDD5C8',  // Stronger border
          400: '#C5B9A5',  // Medium divider
          500: '#8C7E6A',  // Subtext
          600: '#716450',  // Subtext dark
          700: '#584C3B',  // Text body
          800: '#3D3427',  // Primary heading
          900: '#201A12',  // Darkest tone
        },
        sand: {
          50: '#FAF8F5',
          100: '#F4EFEB',
          200: '#E8DED6',
          300: '#D5C4B5',
          400: '#BFA694',
          500: '#A4846F',
          600: '#866854',
          700: '#684F3F',
          800: '#4D392E',
          900: '#30231C',
        },
        clay: {
          light: '#EAD7CD',
          DEFAULT: '#B08974',
          dark: '#7A523E',
        }
      },
      fontFamily: {
        sans: ['Instrument Sans', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(140, 126, 106, 0.08)',
        'soft-lg': '0 10px 30px -4px rgba(140, 126, 106, 0.12)',
        'border-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6), 0 1px 3px 0 rgba(140, 126, 106, 0.05)',
      }
    },
  },
  plugins: [],
}
