/** Custom theme: National University style dark blue (brand) and gold (coral / sun). */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy blue scale (kept under the name "brand" so every component picks it up)
        brand: { 50: '#eef3fb', 100: '#d9e4f5', 200: '#b3c8ea', 300: '#7f9fd2', 400: '#4a73b5', 500: '#1f4a8f', 600: '#12356f', 700: '#0c2754', 800: '#081c3d', 900: '#051329' },
        // Rich gold scale (kept under the names "coral" and "sun")
        coral: { 50: '#fffaeb', 100: '#fdf0c9', 400: '#e8b923', 500: '#d4a017', 600: '#a87a0c' },
        sun: { 100: '#fdf0c9', 400: '#e8b923', 500: '#d4a017' },
        sky: { 100: '#dcecf8', 400: '#6aaadb', 500: '#4f98cf' },
        ink: { 900: '#0f1c33', 700: '#33455c', 500: '#64748b', 400: '#8696a9', 200: '#e2e8ee', 100: '#eef2f5', 50: '#f6f8fb' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(8,28,61,.05), 0 8px 24px -10px rgba(8,28,61,.16)',
        lift: '0 10px 30px -10px rgba(8,28,61,.55)',
      },
      borderRadius: { card: '1rem' },
    },
  },
  plugins: [],
};
