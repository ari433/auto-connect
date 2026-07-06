import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
      screens: {
        '2xl': '1360px',
      },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#D6001C',
          50: '#FFF1F2',
          100: '#FFE1E4',
          200: '#FFC7CD',
          300: '#FF9AA6',
          400: '#F55367',
          500: '#D6001C',
          600: '#B80018',
          700: '#970014',
          800: '#7A0011',
          900: '#5F000D',
        },
        ink: {
          DEFAULT: '#111111',
          soft: '#1B1B1D',
          muted: '#6B6B70',
          faint: '#9A9A9F',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8F8F8',
          sunken: '#F1F1F2',
          border: '#E7E7E9',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 6vw, 5.5rem)', { lineHeight: '0.98', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-lg': ['clamp(2.5rem, 4.5vw, 4rem)', { lineHeight: '1.02', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-md': ['clamp(2rem, 3.2vw, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['clamp(1.5rem, 2.4vw, 2rem)', { lineHeight: '1.1', letterSpacing: '-0.015em', fontWeight: '600' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        eyebrow: '0.18em',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,17,17,0.04), 0 8px 24px -12px rgba(17,17,17,0.12)',
        'card-hover': '0 2px 4px rgba(17,17,17,0.05), 0 24px 48px -20px rgba(17,17,17,0.22)',
        float: '0 20px 60px -24px rgba(17,17,17,0.30)',
        header: '0 1px 0 rgba(17,17,17,0.06)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.6s ease both',
      },
    },
  },
  plugins: [],
};

export default config;
