import { createContext, useContext } from 'react';

export type EditorTheme = {
  background: string;
  surface: string;
  accent: string;
  text: string;
  textMuted: string;
  danger: string;
};

export const defaultTheme: EditorTheme = {
  background: '#0b0b0f',
  surface: '#1c1c26',
  accent: '#7c5cff',
  text: '#ffffff',
  textMuted: '#8a8a99',
  danger: '#ff5c7c',
};

export function mergeTheme(override?: Partial<EditorTheme>): EditorTheme {
  return override ? { ...defaultTheme, ...override } : defaultTheme;
}

export const EditorThemeContext = createContext<EditorTheme>(defaultTheme);
export const useTheme = (): EditorTheme => useContext(EditorThemeContext);
