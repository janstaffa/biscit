module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        dark: {
          300: '#0e1116',
          200: '#11151c',
          100: '#151920',
          50: '#1d222a',
        },
        light: {
          DEFAULT: '#d2d9e6',
          200: '#cccccc',
          300: '#9e9e9e',
          hover: '#e1e4e9',
        },
        accent: {
          DEFAULT: '#e09f3e',
          hover: '#d89530',
          light: 'rgba(224,159,62,0.2)',
        },
        lime: {
          DEFAULT: '#12a900',
          100: '#4fdc3e',
          200: '#3ccc2b',
          300: '#28b318',
        },
      },
      fontFamily: {
        opensans: ['Open Sans', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      fontSize: {
        md: ['15px', '22px'],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
