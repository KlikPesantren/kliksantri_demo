/** @type {import('tailwindcss').Config} */

export default {

  content: [

    "./index.html",

    "./src/**/*.{js,ts,jsx,tsx}"

  ],

  theme: {

    extend: {

      colors: {
        primary: {
          DEFAULT: "#15803D",
          hover: "#166534",
        },
        dark: "#0F172A",
        background: "#F3F4F6",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },

      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
      },

      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
      },

    },

  },

  plugins: [],

}
