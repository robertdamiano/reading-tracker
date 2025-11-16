/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode via class on html element
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      },
    },
  },
  plugins: [
    function({ addVariant }) {
      addVariant('christmas', '.christmas &')
    }
  ],
}
