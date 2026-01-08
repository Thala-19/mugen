/**** Tailwind Config ****/
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/renderer/**/*.{js,jsx,ts,tsx,html}'
  ],
  theme: {
    extend: {
        fontFamily: {
            serif: ['Georgia', 'serif'],
        }
    },
  },
  plugins: [],
};