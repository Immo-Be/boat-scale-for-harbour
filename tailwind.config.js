/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      gridTemplateColumns: {
        2: "var(--sidebar-width) 1fr",
      },
      gridTemplateRows: {
        1: "100dvh",
      },
    },
  },
  plugins: [require("daisyui")],
};
