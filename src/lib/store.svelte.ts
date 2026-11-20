// App state: the saved data, the hash route, saving and toasts.

import { newData, normalize, todayStr } from './data';
import { loadData, saveData } from './db';
import type { Data, PartyEvent } from './types';

export const app = $state<{ d: Data; loaded: boolean }>({ d: newData(), loaded: false });

export async function load(): Promise<void> {
  const stored = await loadData();
  if (stored) app.d = normalize(stored);
  app.loaded = true;
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Saves soon; debounced so typing in a field doesn't write on every keystroke. */
export function save(): void {
  clearTimeout(timer);
  timer = setTimeout(() => saveData(app.d).catch((err) => alert('Could not save: ' + err)), 150);
}

/** Saves a change to one event and marks it as recently changed. */
export function touch(e: PartyEvent): void {
  e.updatedAt = Date.now();
  save();
}

/** Replaces everything (backup import, erase). */
export async function replaceData(d: Data): Promise<void> {
  clearTimeout(timer);
  app.d = d;
  await saveData(d);
}

// Write any pending change before the app is closed or sent to the background.
addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && timer) {
    clearTimeout(timer);
    timer = undefined;
    saveData(app.d).catch(() => {});
  }
});

export const eventById = (id: string | undefined): PartyEvent | undefined => app.d.events.find((e) => e.id === id);

/** Today's date, refreshed when the app comes back to the front (so "in 3 days" rolls over). */
export const today = $state({ s: todayStr() });
addEventListener('visibilitychange', () => (today.s = todayStr()));
setInterval(() => (today.s = todayStr()), 60_000);

// ---------------------------------------------------------------------------------------------
// Routing: #/  #/todo  #/settings  #/install  #/e/<id>/<section>

export type Section = 'overview' | 'guests' | 'todo' | 'food' | 'budget' | 'day';

export interface Route {
  page: 'home' | 'todo' | 'event' | 'settings' | 'install';
  arg?: string;
  section?: Section;
}

const PAGES: Record<string, Route['page']> = { todo: 'todo', e: 'event', settings: 'settings', install: 'install' };
const SECTIONS: Section[] = ['overview', 'guests', 'todo', 'food', 'budget', 'day'];

function parse(hash: string): Route {
  const [page, arg, sec] = hash.replace(/^#\/?/, '').split('/');
  const section = SECTIONS.includes(sec as Section) ? (sec as Section) : 'overview';
  return { page: PAGES[page] ?? 'home', arg: arg ? decodeURIComponent(arg) : undefined, section };
}

export const router = $state({ route: parse(location.hash) });

let lastPage = router.route.page + router.route.arg;
addEventListener('hashchange', () => {
  router.route = parse(location.hash);
  // Switching sections inside one event keeps your scroll near the top tabs instead of jumping.
  const key = router.route.page + router.route.arg;
  if (key !== lastPage) scrollTo(0, 0);
  lastPage = key;
});

export function go(path: string, replace = false): void {
  if (replace) {
    history.replaceState(null, '', '#/' + path);
    router.route = parse(location.hash);
    scrollTo(0, 0);
  } else location.hash = '#/' + path;
}

export function back(fallback = ''): void {
  if (history.length > 1) history.back();
  else go(fallback);
}

// ---------------------------------------------------------------------------------------------
// Toasts

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

export const toasts = $state<Toast[]>([]);
let toastId = 0;

export function toast(text: string, action?: Toast['action'], ms = 5000): number {
  const t = { id: ++toastId, text, action };
  toasts.push(t);
  setTimeout(() => dismissToast(t.id), ms);
  return t.id;
}

export function dismissToast(id: number): void {
  const i = toasts.findIndex((t) => t.id === id);
  if (i >= 0) toasts.splice(i, 1);
}

export const isStandalone =
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** One-shot hints between pages. */
export const ui = $state({ editNext: '' });

export const isApple = /iPhone|iPad|Macintosh/.test(navigator.userAgent);
