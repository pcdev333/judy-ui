/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E8470A',
        background: '#F2F2F7',
        card: '#FFFFFF',
        'text-primary': '#1A1A1A',
        'text-secondary': '#8E8E93',
        'text-muted': '#C7C7CC',
        success: '#34C759',
      },
    },
  },
  plugins: [],
};
