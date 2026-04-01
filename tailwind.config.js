/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-foreground":
          "rgb(var(--color-primary-foreground) / <alpha-value>)",
      },
      boxShadow: {
        md: '0 3px 10px 1px rgba(0, 0, 0, 0.15), 0 3px 6px -3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

