/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
        "./index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-dm-sans)", "sans-serif"],
                serif: ["var(--font-space-grotesk)", "serif"],
            },
        },
    },
    plugins: [],
}