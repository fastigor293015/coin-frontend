/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js}'
  ],
  theme: {
    screens: {
      '2xl': { max: '1535px' },
      xl: { max: '1279px' },
      lg: { max: '1023px' },
      md: { max: '767px' },
      sm: { max: '540px' },
      xs: { max: '380px' },
    },
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: '#116ACC',
        secondary1: '#182233',
        secondary2: '#B3CEE2',
        secondary3: '#D9DDE7',
        secondary4: '#FD4E5D',

        black: '#000000',
        gray1: '#1F2937',
        gray2: '#374151',
        gray3: '#4B5563',
        gray4: '#6B7280',
        gray5: '#9CA3AF',
        gray6: '#D1D5DB',
        gray7: '#F3F4F6',
        white: '#FFFFFF',

        tableborder: 'rgba(0,82,255,0.1)',
        disabled: '#A0C3FF',

        info: '#A0C3FF',
        success: '#76CA66',
        warning: '#E2B93B',
        error: '#BA0000'
      },
    },
  },
  plugins: [],
}
