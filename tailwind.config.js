/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        caacupe: ['"Caacupe One"', 'serif'],
        handwriting: ['"Caveat"', 'cursive'],
        serif: ['"Lora"', 'Georgia', 'serif'],
        sans: ['"Nunito"', 'system-ui', 'sans-serif'],
      },
      colors: {
        parchment: {
          50: '#fdfbf7',
          100: '#f7ecd5',
          200: '#eedab4',
          300: '#e1c28b',
          800: '#432d1d',
          900: '#2b1c11',
        }
      }
    },
  },
  plugins: [],
}
