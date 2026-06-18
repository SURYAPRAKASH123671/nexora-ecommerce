/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        gold:    '#C9A84C',
        'gold-lt': '#E8C97A',
        dark:    '#0A0A0A',
        dark2:   '#111111',
        dark3:   '#141414',
        dark4:   '#1A1A1A',
        border:  '#1E1E1E',
        border2: '#2A2A2A',
        luxe:    '#F5F0E8',
        muted:   '#888888',
        red:     '#E25C5C',
        green:   '#4CAF72',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.2em',
        widest3: '0.3em',
      },
    },
  },
  plugins: [],
}