import type { Config } from 'tailwindcss';

/** Tailwind design tokens for H-Town United dark sports styling. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0F1724',
        panel: '#1B2333',
        accent: '#38BDF8',
        success: '#22C55E',
      },
    },
  },
  plugins: [],
} satisfies Config;
