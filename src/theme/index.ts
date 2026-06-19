// InternSync design tokens — dark, monochrome with status accents.
export const colors = {
  bg: '#0b0b0d',
  bgDeep: '#08080a',
  surface: 'rgba(255,255,255,0.05)',
  surface2: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.2)',
  hairline: 'rgba(255,255,255,0.10)',
  text: '#ffffff',
  textDim: 'rgba(255,255,255,0.6)',
  textFaint: 'rgba(255,255,255,0.4)',
  // status
  green: '#22c55e',
  greenSoft: '#4ade80',
  amber: '#f59e0b',
  amberSoft: '#fbbf24',
  red: '#ef4444',
  redSoft: '#f87171',
  // section accents
  internship: '#8b5cf6',
  scholarship: '#3b82f6',
  extracurricular: '#f97316',
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };

export const font = {
  light: 'Hanken_300Light',
  regular: 'Hanken_400Regular',
  medium: 'Hanken_500Medium',
  semibold: 'Hanken_600SemiBold',
  bold: 'Hanken_700Bold',
};

export type Accent = 'internship' | 'scholarship' | 'extracurricular';
