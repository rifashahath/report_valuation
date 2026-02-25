/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F5FF',
          100: '#E0EBFF',
          200: '#BED7FF',
          300: '#91BCFF',
          400: '#5E9BFF',
          500: '#2E75FF',
          600: '#0052CC', // Professional Blue - Primary Action
          700: '#0042A6',
          800: '#003380',
          900: '#002459',
          950: '#001533',
        },
        secondary: {
          50: '#FAFBFC',
          100: '#F4F5F7',
          200: '#EBECF0',
          300: '#DFE1E6',
          400: '#C1C7D0',
          500: '#A5ADBA',
          600: '#7A869A', // Slate 600
          700: '#5E6C84',
          800: '#42526E',
          900: '#172B4D', // Deep Navy/Slate for Text
          950: '#091E42',
        },
        success: {
          50: '#E3FCEF',
          100: '#ABF5D1',
          500: '#36B37E', // Jungle Green
          700: '#006644',
        },
        warning: {
          50: '#FFFAE6',
          100: '#FFF0B3',
          500: '#FFAB00', // Amber
          700: '#FF8B00',
        },
        danger: {
          50: '#FFEBE6',
          100: '#FFBDAD',
          500: '#FF5630', // Red
          700: '#DE350B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
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
};
