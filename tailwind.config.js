/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./packages/renderer/src/**/*.{js,ts,jsx,tsx,vue}",
    "./packages/renderer/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Avenir', 'Helvetica', 'Arial', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
