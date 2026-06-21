/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: { DEFAULT: '#FBF3E4', deep: '#F6E7CE' },
        driftwood: { light: '#C9A06A', DEFAULT: '#A87C4F', dark: '#7A5836' },
        seaglass: { DEFAULT: '#5FB8B0', light: '#8FD6CE', deep: '#3E8D86' },
        coral: { light: '#FFB59A', DEFAULT: '#FF8A6B', dark: '#E86F50' },
        pearl: { DEFAULT: '#FFE9C2', gold: '#FFCB47' },
      },
      fontFamily: {
        display: ['Baloo 2', 'Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        candy: '0 6px 0 0 rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.12)',
        'candy-coral': '0 4px 0 0 #E86F50, 0 6px 14px rgba(232,111,80,0.4)',
        'candy-teal': '0 4px 0 0 #3E8D86, 0 6px 14px rgba(62,141,134,0.35)',
        'candy-gold': '0 4px 0 0 #E0A93A, 0 6px 14px rgba(224,169,58,0.35)',
        cardsoft: '0 8px 24px rgba(122,88,54,0.15)',
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(0.6)', opacity: '0' }, '70%': { transform: 'scale(1.1)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        floatUp: { '0%': { transform: 'translateY(0)', opacity: '1' }, '100%': { transform: 'translateY(-40px)', opacity: '0' } },
        leap: { '0%': { transform: 'translateY(0) scale(1)' }, '40%': { transform: 'translateY(-46px) scale(1.2)' }, '100%': { transform: 'translateY(-90px) scale(0.4)', opacity: '0' } },
        shimmer: { '0%,100%': { opacity: '0.4' }, '50%': { opacity: '1' } },
        wave: { '0%': { transform: 'translateX(-60%)' }, '100%': { transform: 'translateX(60%)' } },
        shake: { '0%,100%': { transform: 'translate(0,0)' }, '20%': { transform: 'translate(-4px,2px)' }, '40%': { transform: 'translate(4px,-2px)' }, '60%': { transform: 'translate(-3px,1px)' }, '80%': { transform: 'translate(3px,-1px)' } },
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
      },
      animation: {
        pop: 'pop 0.3s ease-out',
        floatUp: 'floatUp 0.9s ease-out forwards',
        leap: 'leap 1s ease-in forwards',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        wave: 'wave 1s ease-in-out',
        shake: 'shake 0.4s ease-in-out',
        bob: 'bob 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
