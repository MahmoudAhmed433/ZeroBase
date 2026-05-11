/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        board: '#6f4e37',
        paper: '#fef9ef',
        ink: '#1f2937',
        trust: '#0f766e'
      },
      fontFamily: {
        serifHead: ['Georgia', 'Times New Roman', 'serif'],
        sansBody: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        paper: '0 10px 24px rgba(0,0,0,0.24)',
        paperLift: '0 18px 34px rgba(0,0,0,0.34)'
      }
    }
  },
  plugins: []
};
