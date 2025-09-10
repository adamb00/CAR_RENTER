// src/types/theme.ts
export type Mode = 'light' | 'dark' | 'system';

export type ThemeStyles = {
  light?: Record<string, string | number>;
  dark?: Record<string, string | number>;
};

export interface ThemeConfig {
  styles?: ThemeStyles;
}

export interface Settings {
  mode: Mode; // aktuális mód
  theme: ThemeConfig; // tetszőleges extra stílusok / tokenek
}
