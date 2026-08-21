import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

// Tokens conforme docs/design.md secao 4.2. Os valores hexadecimais da escala
// `marca` sao as cores oficiais extraidas da arte do Dentinho.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', md: '1.5rem', lg: '2rem' },
      screens: { '2xl': '80rem' },
    },
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        sucesso: {
          DEFAULT: 'hsl(var(--sucesso))',
          foreground: 'hsl(var(--sucesso-foreground))',
        },
        alerta: {
          DEFAULT: 'hsl(var(--alerta))',
          foreground: 'hsl(var(--alerta-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Escala neutra tingida de marca: o hue desliza de 200 (turquesa-azul)
        // ate 209 (azul do logotipo). Substitui o `slate` — cinza puro apaga
        // a marca nas superficies grandes. Ver docs/design.md secao 2.4.
        neutro: {
          50: '#FBFDFE',
          100: '#F0F7FA',
          200: '#DEEDF2',
          300: '#CBE3EB',
          400: '#8EB1C2',
          500: '#668CA3',
          600: '#4D6A80',
          700: '#344C60',
          800: '#1C2F40',
          900: '#0F1C29',
          950: '#07121D',
        },
        marca: {
          azul: {
            50: '#EBF5FF',
            100: '#D1E9FF',
            200: '#A3D3FF',
            300: '#6BB8FF',
            400: '#2997FF',
            500: '#0077E6',
            600: '#0061BD',
            700: '#004E98',
            800: '#003F7A',
            900: '#002D57',
          },
          turquesa: {
            50: '#E8FDF9',
            100: '#CCFAF2',
            200: '#A2F6E8',
            300: '#73F1DD',
            400: '#3EEACD',
            500: '#11C5A7',
            600: '#0A9E86',
            700: '#077E6A',
            800: '#056152',
            900: '#044339',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
