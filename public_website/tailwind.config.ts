import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './sections/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          hover: '#E85A26',
          active: '#D24B1A',
          50: '#FFF7F4',
          100: '#FFECE4',
          200: '#FFD5C5',
          300: '#FFB397',
          400: '#FF8A60',
          500: '#FF6B35',
          600: '#E85A26',
          700: '#C24519',
          800: '#9C3513',
          900: '#7E2D12',
        },
        craviti: {
          dark: '#111827',
          text: '#1F2937',
          gray: '#6B7280',
          muted: '#9CA3AF',
          bg: '#FFFFFF',
          light: '#F9FAFB',
          border: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(17, 24, 39, 0.05)',
        'subtle': '0 2px 10px 0 rgba(17, 24, 39, 0.04)',
        'glow': '0 0 35px -5px rgba(255, 107, 53, 0.25)',
        'elevated': '0 20px 40px -15px rgba(17, 24, 39, 0.08)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

