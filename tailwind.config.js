module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Farben
      colors: {
        primary: '#1a1a1a',      // Schwarz
        secondary: '#3d2817',    // Dunkelbraun
        accent: '#c9a66b',       // Gold
        surface: '#f8f7f4',      // Cremeweiß
      },
      
      // Schriften
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      
      // Schatten (subtiler)
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.08)',
        'medium': '0 4px 16px rgba(0,0,0,0.12)',
        'strong': '0 8px 24px rgba(0,0,0,0.16)',
      },
    },
  },
  plugins: [],
}