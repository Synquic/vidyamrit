/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
        "./index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-sans)", "Inter", "sans-serif"],
                serif: ["var(--font-serif)", "serif"],
                display: ["var(--font-display)", "sans-serif"],
                devanagari: ["'Noto Sans Devanagari'", "sans-serif"],
                inter: ["Inter", "sans-serif"],
            },
            fontWeight: {
                light: '300',
                normal: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
            },
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                'medium': '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.06)',
                'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 12px -4px rgba(0, 0, 0, 0.1)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}