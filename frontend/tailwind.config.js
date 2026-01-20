/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Success colors
    'bg-success-50', 'bg-success-100', 'bg-success-200', 'bg-success-500', 'bg-success-600',
    'text-success-400', 'text-success-500', 'text-success-600', 'text-success-700', 'text-success-800',
    'border-success-200', 'border-success-500',
    'dark:bg-success-500/15', 'dark:bg-success-500/20', 'dark:text-success-400', 'dark:border-success-500/30',
    // Warning colors
    'bg-warning-50', 'bg-warning-100', 'bg-warning-200', 'bg-warning-500', 'bg-warning-600',
    'text-warning-400', 'text-warning-500', 'text-warning-600', 'text-warning-700', 'text-warning-800',
    'border-warning-200', 'border-warning-500',
    'dark:bg-warning-500/15', 'dark:bg-warning-500/20', 'dark:text-warning-400', 'dark:border-warning-500/30',
    // Danger colors
    'bg-danger-50', 'bg-danger-100', 'bg-danger-200', 'bg-danger-500', 'bg-danger-600',
    'text-danger-400', 'text-danger-500', 'text-danger-600', 'text-danger-700', 'text-danger-800',
    'border-danger-200', 'border-danger-500',
    'dark:bg-danger-500/15', 'dark:bg-danger-500/20', 'dark:text-danger-400', 'dark:border-danger-500/30',
    // Info colors
    'bg-info-50', 'bg-info-100', 'bg-info-200', 'bg-info-500', 'bg-info-600',
    'text-info-400', 'text-info-500', 'text-info-600', 'text-info-700', 'text-info-800',
    'border-info-200', 'border-info-500',
    'dark:bg-info-500/15', 'dark:bg-info-500/20', 'dark:text-info-400', 'dark:border-info-500/30',
    // Accent colors
    'bg-accent-50', 'bg-accent-100', 'bg-accent-200', 'bg-accent-500', 'bg-accent-600',
    'text-accent-400', 'text-accent-500', 'text-accent-600', 'text-accent-700',
    'border-accent-200', 'border-accent-500',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        background: '#000000',
        surface: {
          DEFAULT: '#171717',
          50: '#262626',
          100: '#1f1f1f',
          200: '#171717',
          300: '#0f0f0f',
          400: '#0a0a0a',
        },
        // Primary - Crimson Red (matching landing page)
        primary: {
          DEFAULT: '#e11d48',
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#e11d48',
          600: '#be123c',
          700: '#9f1239',
          800: '#881337',
          900: '#701a2d',
          950: '#4c0519',
        },
        // Accent - Same as primary for consistency
        accent: {
          DEFAULT: '#e11d48',
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#e11d48',
          600: '#be123c',
          700: '#9f1239',
          800: '#881337',
          900: '#701a2d',
        },
        // Status colors
        success: {
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
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Glass colors
        glass: {
          border: 'rgba(255, 255, 255, 0.08)',
          surface: 'rgba(255, 255, 255, 0.03)',
          hover: 'rgba(255, 255, 255, 0.06)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '0.85rem' }],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
        'elevated': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        'modal': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner-top': 'inset 0 1px 0 0 rgb(255 255 255 / 0.1)',
        'glow': '0 0 20px rgba(225, 29, 72, 0.4)',
        'glow-sm': '0 0 10px rgba(225, 29, 72, 0.3)',
        'glow-lg': '0 0 40px rgba(225, 29, 72, 0.5)',
        'glow-accent': '0 0 20px -5px rgb(225 29 72 / 0.4)',
        'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glass-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(90deg, #be123c, #e11d48)',
        'gradient-primary-reverse': 'linear-gradient(90deg, #e11d48, #be123c)',
        'gradient-shine': 'linear-gradient(90deg, #e11d48, #fb7185, #e11d48)',
        'sidebar-gradient': 'linear-gradient(180deg, #171717 0%, #000000 100%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
        'grid-pattern': 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 12s linear infinite',
        'blob': 'blob 7s infinite',
        'float': 'float 6s ease-in-out infinite',
        'shine': 'shine 1.5s linear infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing-dot': 'typingDot 1s ease-in-out infinite',
        'message-pop': 'messagePop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shine: {
          'from': { backgroundPosition: '0 0' },
          'to': { backgroundPosition: '-200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(225, 29, 72, 0.5)' },
          '50%': { opacity: '0.5', boxShadow: '0 0 10px rgba(225, 29, 72, 0.3)' },
        },
        typingDot: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.5' },
          '50%': { transform: 'translateY(-3px)', opacity: '1' },
        },
        messagePop: {
          'from': { opacity: '0', transform: 'translateY(10px) scale(0.95)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
