module.exports = {
  mode: 'jit',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'mtall': { 'raw': '(min-height: 640px)' },
        // => @media (min-height: 768px) { ... }
        'tall': { 'raw': '(min-height: 1024px)' },
        // => @media (min-height: 1024px) { ... }
        'hoverable': { 'raw': '(hover: hover)' },
        // => @media (hover: hover) { ... }
      }
    },
  },
  plugins: [],
}
