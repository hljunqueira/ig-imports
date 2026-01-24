/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#D4AF37",
                "gold-light": "#F9E29B",
                "gold-dark": "#B8860B",
                "background-dark": "#050505",
                "card-dark": "#0F0F0F",
                "sidebar-dark": "#0A0A0A",
                "accent-gold": "#C5A028"
            },
            fontFamily: {
                display: ["Cinzel", "serif"],
                sans: ["Inter", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "2px",
            },
        },
    },
    plugins: [],
}
