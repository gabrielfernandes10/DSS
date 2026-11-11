import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#101D32',
        brand: '#1769AA',
        cyan: '#19B6C9',
        mist: '#F3F6FA',
        ink: '#102033',
        line: '#DDE6EF',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 60px rgba(16, 29, 50, 0.10)',
        panel: '0 12px 36px rgba(16, 29, 50, 0.08)',
      },
      backgroundImage: {
        'circuit-grid': 'linear-gradient(rgba(25,182,201,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(25,182,201,0.09) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
} satisfies Config
