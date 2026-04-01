/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-secondary": "#ffffff",
        "error-container": "#ffdad6",
        "on-background": "#171c1f",
        "primary-fixed": "#d7e3f7",
        "on-primary-fixed": "#101c2a",
        "on-surface-variant": "#44474c",
        "on-secondary-fixed": "#0d1c2e",
        "secondary-fixed-dim": "#b9c7df",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f4f8",
        "inverse-on-surface": "#edf1f5",
        "surface-tint": "#535f6f",
        "on-surface": "#171c1f",
        "surface-container-high": "#e4e9ed",
        "on-primary": "#ffffff",
        "on-error-container": "#93000a",
        "surface-bright": "#f6fafe",
        "tertiary-fixed-dim": "#adc6ff",
        "on-primary-fixed-variant": "#3c4857",
        "primary-fixed-dim": "#bbc7da",
        "primary": "#05111e",
        "error": "#ba1a1a",
        "inverse-surface": "#2c3134",
        "on-tertiary-fixed": "#001a41",
        "on-primary-container": "#818d9f",
        "tertiary-container": "#002353",
        "background": "#f6fafe",
        "surface-dim": "#d6dade",
        "tertiary-fixed": "#d8e2ff",
        "outline-variant": "#c4c6cc",
        "inverse-primary": "#bbc7da",
        "on-secondary-container": "#57657a",
        "on-tertiary-fixed-variant": "#004493",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed-variant": "#3a485b",
        "primary-container": "#1a2634",
        "surface-container-highest": "#dfe3e7",
        "surface": "#f6fafe",
        "secondary-fixed": "#d5e3fc",
        "tertiary": "#000f2a",
        "secondary-container": "#d5e3fc",
        "outline": "#75777c",
        "on-tertiary-container": "#3f89ff",
        "secondary": "#515f74",
        "surface-container": "#eaeef2",
        "on-error": "#ffffff",
        "surface-variant": "#dfe3e7"
      },
      fontFamily: {
        "headline": ["Manrope"],
        "body": ["Inter"],
        "label": ["Inter"]
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
