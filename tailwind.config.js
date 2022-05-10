module.exports = {
  mode: 'jit',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/common/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'mtall': { 'raw': '(min-height: 640px)' },
        // => @media (min-height: 768px) { ... }
        'tall': { 'raw': '(min-height: 1024px) and (max-width: 1024px)' },
        // => @media (min-height: 1024px) { ... }
        'hoverable': { 'raw': '(hover: hover)' },
        // => @media (hover: hover) { ... }
      }
    },
  },
  plugins: [],
}
