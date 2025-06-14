/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-gentle': 'pulseGentle 3s ease-in-out infinite',
        'orbit-1': 'orbit1 15s linear infinite',
        'orbit-2': 'orbit2 20s linear infinite',
        'orbit-3': 'orbit3 18s linear infinite',
        'orbit-4': 'orbit4 25s linear infinite',
        'orbit-5': 'orbit5 22s linear infinite',
        'orbit-6': 'orbit6 19s linear infinite',
        'orbit-7': 'orbit7 17s linear infinite',
        'orbit-8': 'orbit8 23s linear infinite',
        'orbit-9': 'orbit9 21s linear infinite',
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
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        orbit1: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        orbit2: {
          '0%': { transform: 'rotate(60deg)' },
          '100%': { transform: 'rotate(420deg)' },
        },
        orbit3: {
          '0%': { transform: 'rotate(120deg)' },
          '100%': { transform: 'rotate(480deg)' },
        },
        orbit4: {
          '0%': { transform: 'rotate(180deg)' },
          '100%': { transform: 'rotate(540deg)' },
        },
        orbit5: {
          '0%': { transform: 'rotate(240deg)' },
          '100%': { transform: 'rotate(600deg)' },
        },
        orbit6: {
          '0%': { transform: 'rotate(300deg)' },
          '100%': { transform: 'rotate(660deg)' },
        },
        orbit7: {
          '0%': { transform: 'rotate(30deg)' },
          '100%': { transform: 'rotate(390deg)' },
        },
        orbit8: {
          '0%': { transform: 'rotate(90deg)' },
          '100%': { transform: 'rotate(450deg)' },
        },
        orbit9: {
          '0%': { transform: 'rotate(150deg)' },
          '100%': { transform: 'rotate(510deg)' },
        }
      }
    },
  },
  plugins: [],
}