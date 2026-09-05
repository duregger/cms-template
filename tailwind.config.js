/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        optic: ['Optic', 'Impact', 'Helvetica Neue', 'sans-serif'],
        metallophile: ['Metallophile Sp8', 'Helvetica Neue', 'sans-serif'],
        cabin: ['Cabin', 'Helvetica Neue', 'sans-serif'],
        'nunito-sans': ['Nunito Sans', 'sans-serif'],
      },
      fontSize: {
        'label-sm': ['11px', { lineHeight: '110%' }],
        'label-xl': ['18px', { lineHeight: '110%' }],
      },
      colors: {
        // Default CMS accent palette — blue-forward, seeded from #3b3bff.
        // Values are runtime-overridable via design-tokens (CSS vars).
        brand: {
          DEFAULT: 'var(--brand-primary, #3b3bff)',
          primary: 'var(--brand-primary, #3b3bff)',
          cloud: 'var(--brand-cloud, #eef1ff)',
          mist: 'var(--brand-mist, #dfe4ff)',
          ink: 'var(--brand-ink, #14142b)',
          accent: 'var(--brand-accent, #ffb020)',
          success: 'var(--brand-success, #4d7c0f)',
          gray: 'var(--brand-gray, #d4d4d4)',
          // accent registers derived from brand-primary at runtime — see src/lib/accent.ts
          rest: 'var(--brand-rest, rgba(59, 59, 255, 0.13))',
          hover: 'var(--brand-hover, rgba(59, 59, 255, 0.26))',
          // text-safe accent ink, and the foreground for a 100%-fill accent surface
          'ink-on-tint': 'var(--brand-ink-on-tint, #292999)',
          on: 'var(--brand-on, #fbfcfd)',
          rail: 'var(--brand-rail, #f4f4ff)',
          // primary-button hover: SURFACE layered at 74% over the 100% fill
          wash: 'var(--brand-wash, #b3b3ff)',
        },
        // CMS admin chrome — neutral scale, independent of the brand accent.
        page: 'var(--cms-page, #e1e6e9)',
        surface: 'var(--cms-surface, #fbfcfd)',
        'text-muted': 'var(--cms-text-muted, rgba(26, 24, 20, 0.62))',
        'text-subtle': 'var(--cms-text-subtle, rgba(26, 24, 20, 0.42))',
        hairline: 'var(--cms-hairline, rgba(26, 24, 20, 0.10))',
        'hairline-soft': 'var(--cms-hairline-soft, rgba(26, 24, 20, 0.07))',
        danger: 'var(--cms-danger, #dc2626)',
        'danger-strong': 'var(--cms-danger-strong, #b91c1c)',
        'danger-tint': 'var(--cms-danger-tint, #fef2f2)',
      },
      spacing: {
        spacing02: '4px',
        spacing03: '8px',
        spacing04: '12px',
        spacing05: '16px',
        spacing06: '24px',
        spacing07: '32px',
        spacing08: '40px',
        spacing09: '48px',
        spacing10: '64px',
        spacing11: '80px',
      },
      borderRadius: {
        pill: '100px',
        card: '16px',
        // concentric scale — shell > panel > tile > control
        shell: '12px',
        panel: '10px',
        tile: '8px',
        control: '6px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 28, 34, 0.035)',
        shell: '0 1px 2px rgba(22, 28, 34, 0.04), 0 8px 24px rgba(22, 28, 34, 0.06)',
        overlay: '0 1px 2px rgba(22, 28, 34, 0.05), 0 8px 20px rgba(22, 28, 34, 0.09)',
        button: '0 1px 2px rgba(22, 28, 34, 0.10)',
        panel: 'var(--shadow-border)',
        'panel-hover': 'var(--shadow-border-hover)',
      },
      transitionDuration: {
        state: '170ms',
        panel: '180ms',
      },
      transitionTimingFunction: {
        panel: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
