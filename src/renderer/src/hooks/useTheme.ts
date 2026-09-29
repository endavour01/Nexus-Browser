import { useEffect } from 'react';
import type { ThemePreference } from '@shared/types';

export function applyThemePreference(theme: ThemePreference): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
}

export function useTheme(theme: ThemePreference | undefined): void {
  useEffect(() => {
    applyThemePreference(theme ?? 'dark');
  }, [theme]);
}
