/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    'border-amber-500', 'bg-amber-50', 'text-amber-600', 'ring-amber-500', 
    'hover:border-amber-500', 'hover:bg-amber-50', 'bg-amber-100', 
    'text-amber-800', 'bg-amber-500', 'hover:bg-amber-600',
    'bg-amber-600'
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
