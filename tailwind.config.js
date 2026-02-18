/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4a5d54',        // Simonetti Dunkelgrün
        'primary-dark': '#3d4e46',
        secondary: '#8da399',      // Simonetti Hellgrün
        accent: '#FFB800',         // Gelb für Highlights
        cream: '#fdfcfb',          // Cremiger Hintergrund
        dark: '#1A1A1A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
