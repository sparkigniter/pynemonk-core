/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1', // Indigo 500
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                surface: {
                    50: '#f8fafc', // Slate 50
                    100: '#f1f5f9', // Slate 100
                    200: '#e2e8f0', // Slate 200
                    300: '#cbd5e1', // Slate 300
                    400: '#94a3b8', // Slate 400
                    500: '#64748b', // Slate 500
                    600: '#475569', // Slate 600
                    700: '#334155', // Slate 700
                    800: '#1e293b', // Slate 800
                    900: '#0f172a', // Slate 900
                }
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            }
        },
    },
    plugins: [],
}