import { useCallback, useEffect, useState } from 'react';
import { THEME_KEY } from './constants';

export type ThemePreference = 'light' | 'dark' | 'system';

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* ignore */
  }
  return 'system';
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(preference: ThemePreference): void {
  if (typeof document === 'undefined') return;
  const dark = preference === 'dark' || (preference === 'system' && systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);

  useEffect(() => {
    apply(preference);
    try {
      localStorage.setItem(THEME_KEY, preference);
    } catch {
      /* ignore */
    }

    if (preference !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  const cycle = useCallback(() => {
    setPreference((current) => (current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'));
  }, []);

  return { preference, setPreference, cycle };
}
