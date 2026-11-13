/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        landscape: { raw: '(orientation: landscape)' },
      },
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
      },
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '68': '17rem',
      }
    },
  },
  plugins: [],
}
