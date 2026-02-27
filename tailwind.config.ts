import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        bai: ['Bai Jamjuree', 'sans-serif'],
        pop: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary:   '#96865D',
        secondary: '#DBDCDD',
        gray:      '#F0F0F0',
        'gray-mid':'#D8D8D8',
        'gray-dark':'#9A9A9A',
        'gray-text':'#555555',
        foreground:'#171717',
      },
      animation: {
        'card-in':   'cardIn 0.35s ease both',
        'fade-in':   'fadeIn 0.3s ease',
        'slide-in':  'slideIn 0.45s cubic-bezier(0.25,0.46,0.45,0.94)',
        'toast-in':  'toastIn 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
        'zoom-slow': 'zoomSlow 8s ease-in-out infinite alternate',
      },
      keyframes: {
        cardIn:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn:  { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        toastIn:  { from: { transform: 'translateX(110%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        zoomSlow: { from: { transform: 'scale(1)' }, to: { transform: 'scale(1.05)' } },
      },
      boxShadow: {
        'card':   '0 1px 4px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 32px rgba(206,55,49,0.12)',
        'modal':  '0 20px 60px rgba(0,0,0,0.15)',
        'header': '0 1px 0 #F0F0F0',
      },
    },
  },
  plugins: [
    // Hide scrollbar but keep scrollable
    function({ addUtilities }: { addUtilities: (u: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-hide::-webkit-scrollbar': {
          'display': 'none',
        },
      })
    },
  ],
}
export default config
