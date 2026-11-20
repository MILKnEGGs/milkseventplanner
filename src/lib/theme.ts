// Fonts (bundled for offline use) and light/dark mode. Light ("confetti") is the default.

import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';

import type { ThemeMode } from './types';

const media = matchMedia('(prefers-color-scheme: dark)');
let mode: ThemeMode = 'light';

function apply(): void {
  const dark = mode === 'dark' || (mode === 'auto' && media.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#160d1c' : '#4a1d4f');
}

media.addEventListener('change', apply);

export function setThemeMode(m: ThemeMode): void {
  mode = m;
  apply();
}
