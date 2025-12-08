/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#BE943F',
          light: '#ECDC88',
          dark: '#BE943F',
        },
        silver: {
          DEFAULT: '#9B9B9B',
          light: '#FFFFFF',
          dark: '#9B9B9B',
        },
        primary: {
          DEFAULT: '#BE943F',
          50: '#fef9e7',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#BE943F',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(to right, #BE943F, #ECDC88, #BE943F)',
        'gradient-silver': 'linear-gradient(to right, #9B9B9B, #FFFFFF, #9B9B9B)',
        'gradient-gold-vertical': 'linear-gradient(to bottom, #BE943F, #ECDC88, #BE943F)',
        'gradient-silver-vertical': 'linear-gradient(to bottom, #9B9B9B, #FFFFFF, #9B9B9B)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
