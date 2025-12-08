/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Blind 앱 메인 컬러 (핑크-퍼플 시스템)
        primary: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#FF5864',    // Main brand color
          600: '#FD297B',    // Darker pink
          700: '#E11D48',
          800: '#BE123C',
          900: '#9F1239',
        },
        // 기존 컬러 유지 (하위 호환성)
        'coral-pink': '#FF5864',  // primary-500과 동일하게 변경
        'jam-red': '#FF6B9D',
        'cream': '#FFF8F0',
        'toast-peach': '#FFB4A2',
        'honey-gold': '#FFD93D',
        'toast-brown': '#D4A574',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
      },
      // 🆕 Fluid Typography (2025)
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',    // 12px → 14px
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',      // 14px → 16px
        'fluid-base': 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',    // 16px → 18px
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.5rem)',      // 18px → 24px
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem)',     // 20px → 28px
        'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2.25rem)',        // 24px → 36px
        'fluid-3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 3rem)',     // 30px → 48px
        'fluid-4xl': 'clamp(2.25rem, 2rem + 1.25vw, 3.5rem)',       // 36px → 56px
      },
      // 🆕 Safe Area Spacing
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // 🆕 Touch Target 최소 크기 (WCAG 2.5.8)
      minHeight: {
        'touch': '44px',     // WCAG Level AAA
        'touch-lg': '48px',  // Material Design
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'button': '0 10px 15px -3px rgba(255, 88, 100, 0.4)',
        'nav': '0 -2px 10px rgba(0, 0, 0, 0.05)',
      },
      // 🆕 Animations
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'bell-ring': 'bell-ring 0.8s ease-in-out infinite',
        'highlight-fade': 'highlight-fade 6s ease-in-out forwards',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bell-ring': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%, 30%, 50%, 70%': { transform: 'rotate(-15deg)' },
          '20%, 40%, 60%': { transform: 'rotate(15deg)' },
          '80%': { transform: 'rotate(-8deg)' },
          '90%': { transform: 'rotate(8deg)' },
        },
        'highlight-fade': {
          '0%': { backgroundColor: 'transparent' },
          '10%': { backgroundColor: 'rgba(255, 88, 100, 0.1)' },  // coral-pink/10 - 빠른 페이드인
          '80%': { backgroundColor: 'rgba(255, 88, 100, 0.1)' },  // 긴 유지
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}
