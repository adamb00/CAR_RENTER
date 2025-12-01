'use client';
import { create } from 'zustand';
import { Settings, Mode } from '@/types/theme';

type SettingsState = {
  settings: Settings;
  updateSettings: (next: Settings) => void;
  setMode: (mode: Mode) => void;
};

const defaultSettings: Settings = {
  mode: 'system',
  theme: { styles: { light: {}, dark: {} } },
};

export const useSettings = create<SettingsState>((set) => ({
  settings: defaultSettings,
  updateSettings: (next) => set({ settings: next }),
  setMode: (mode) => set((s) => ({ settings: { ...s.settings, mode } })),
}));
