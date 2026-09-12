/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#0b0d14",
          900: "#12141d",
          800: "#1a1d2a",
          700: "#252938",
          600: "#3a3f52",
        },
        felt: {
          400: "#4ade80",
          500: "#22c55e",
        },
        gold: {
          400: "#fbbf24",
        },
      },
    },
  },
  plugins: [],
};
