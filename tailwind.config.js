/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'enex-blue': '#003366',
        'enex-green': '#28a745', // Added enex-green
      },
    },
  },
  plugins: [],
}
