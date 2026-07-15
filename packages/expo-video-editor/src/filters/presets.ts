import type { ColorMatrix } from '../types';

export const IDENTITY_MATRIX: ColorMatrix = [
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
];

export type FilterPreset = { key: string; label: string; matrix: ColorMatrix };

export const FILTER_PRESETS: FilterPreset[] = [
  { key: 'normal', label: 'Normal', matrix: IDENTITY_MATRIX },
  {
    key: 'bw',
    label: 'B&W',
    matrix: [
      0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1,
      0,
    ],
  },
  {
    key: 'vintage',
    label: 'Vintage',
    matrix: [
      0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131, 0, 0, 0, 0, 0, 1,
      0,
    ],
  },
  {
    key: 'warm',
    label: 'Warm',
    matrix: [1.1, 0, 0, 0, 0.02, 0, 1.05, 0, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    key: 'cool',
    label: 'Cool',
    matrix: [0.9, 0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 1.1, 0, 0.02, 0, 0, 0, 1, 0],
  },
  {
    key: 'retro',
    label: 'Retro',
    matrix: [0.9, 0.05, 0, 0, 0.07, 0, 0.85, 0.05, 0, 0.07, 0.05, 0, 0.8, 0, 0.09, 0, 0, 0, 1, 0],
  },
  {
    key: 'neon',
    label: 'Neon',
    matrix: [
      1.3505, -0.2935, -0.057, 0, 0, -0.1495, 1.2065, -0.057, 0, 0, -0.1495, -0.2935, 1.443, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    key: 'sunset',
    label: 'Sunset',
    matrix: [1.15, 0.05, 0, 0, 0.03, 0.02, 1.0, 0, 0, 0.01, 0, 0, 0.85, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    key: 'film',
    label: 'Film',
    matrix: [
      1.0, 0.03, 0.02, 0, 0.02, 0.02, 1.0, 0.02, 0, 0.02, 0.02, 0.05, 0.95, 0, 0.02, 0, 0, 0, 1, 0,
    ],
  },
  {
    key: 'fade',
    label: 'Fade',
    matrix: [0.8, 0, 0, 0, 0.1, 0, 0.8, 0, 0, 0.1, 0, 0, 0.8, 0, 0.12, 0, 0, 0, 1, 0],
  },
  {
    key: 'norway',
    label: 'Norway',
    matrix: [1.05, 0, 0, 0, 0, 0, 1.0, 0.03, 0, 0, 0, 0.05, 1.05, 0, 0.02, 0, 0, 0, 1, 0],
  },
];

const BY_KEY: Record<string, FilterPreset> = Object.fromEntries(
  FILTER_PRESETS.map((p) => [p.key, p])
);

export function getFilterMatrix(key: string): ColorMatrix {
  return (BY_KEY[key] ?? BY_KEY.normal).matrix;
}

export function isIdentityFilter(key: string): boolean {
  return key === 'normal';
}
