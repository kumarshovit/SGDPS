/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Saffron / Kesariya
        saffron: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C', // Core Saffron
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Secondary Deep Maroon / Burgundy
        maroon: {
          50: '#FDF2F4',
          100: '#FCE4E8',
          200: '#F8CBD3',
          300: '#F1A2AF',
          400: '#E46B81',
          500: '#C93954',
          600: '#9E243B',
          700: '#7C1F2E', // Core Deep Maroon
          800: '#631520',
          900: '#4E0F19', // Darkest Maroon
          950: '#32060D',
        },
        // Antique / Warm Gold
        gold: {
          50: '#FDFBF5',
          100: '#FAF5E8',
          200: '#F4E8CB',
          300: '#EBD6A3',
          400: '#E2BF75',
          500: '#E8A33D', // Core Warm Gold
          600: '#D48C28',
          700: '#B8701B',
          800: '#945618',
          900: '#7A4517',
        },
        // Warm Cream / Ivory / Sand Surfaces
        cream: {
          50: '#FAF8F3',
          100: '#F5EFE4',
          200: '#EFE6D4',
          300: '#E5D6BD',
          400: '#D5BF9E',
          500: '#C2A67E',
          canvas: '#FAF6EE',
          card: '#FFFFFF',
          border: '#E8DEC8',
        },
        // Deep Charcoal / Night Brown (Dark Mode)
        charcoal: {
          50: '#F6F5F4',
          100: '#E5E2DF',
          200: '#CAC4BF',
          300: '#AFA49C',
          400: '#84756B',
          500: '#5C4E44',
          600: '#42362E',
          700: '#2E241E',
          800: '#221914', // Dark Card
          900: '#1A120E', // Dark Surface
          950: '#120B08', // Dark Canvas
        },
        // Leaf / Forest Green (Financial Inflows / Positive)
        leaf: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A', // Core Leaf Green
          700: '#15803D',
          800: '#166534',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 4px 20px -2px rgba(232, 163, 61, 0.3)',
        'glow-gold': '0 0 25px -3px rgba(232, 163, 61, 0.35)',
        'glow-saffron': '0 0 25px -3px rgba(234, 88, 12, 0.35)',
        'glow-maroon': '0 0 25px -3px rgba(124, 31, 46, 0.35)',
        'glow-leaf': '0 0 25px -3px rgba(22, 163, 74, 0.35)',
        festive: '0 8px 30px -4px rgba(78, 15, 25, 0.08)',
        'festive-dark': '0 10px 30px -5px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};
