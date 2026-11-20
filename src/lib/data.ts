// Pure logic: new events, dates, headcounts, guest-list parsing, starter checklists, invitation wording,
// budget totals, backup and calendar files. No browser APIs here, so it's all unit-tested.

import type { CardStyle, Data, Expense, Food, Guest, Kind, PartyEvent, Place, Rsvp, Settings, Slot, Task } from './types';

export function uid(n = 10): string {
  const abc = 'abcdefghijkmnopqrstuvwxyz23456789';
  let s = '';
  const r = crypto.getRandomValues(new Uint8Array(n));
  for (const b of r) s += abc[b % abc.length];
  return s;
}

// ---------------------------------------------------------------------------------------------
// Kinds and statuses

export const KINDS: { id: Kind; label: string; emoji: string }[] = [
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'holiday', label: 'Holiday', emoji: '🎄' },
  { id: 'shower', label: 'Shower', emoji: '🍼' },
  { id: 'wedding', label: 'Wedding / anniversary', emoji: '💍' },
  { id: 'dinner', label: 'Dinner', emoji: '🍽️' },
  { id: 'cookout', label: 'Cookout', emoji: '🍔' },
  { id: 'graduation', label: 'Graduation', emoji: '🎓' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

export const kindOf = (k: Kind) => KINDS.find((x) => x.id === k) ?? KINDS[KINDS.length - 1];

export const EMOJIS = ['🎂', '🎉', '🎈', '🎁', '🦄', '🦖', '🧁', '🍕', '🏊', '⚽', '🎮', '🎨', '👑', '🚀', '🌈', '🎄', '🎃', '🍼', '💍', '🍽️', '🍔', '🎓', '🏕️', '✨'];

export const STATUSES: { id: Rsvp; label: string; short: string; emoji: string }[] = [
  { id: 'list', label: 'Not invited yet', short: 'Not invited', emoji: '📝' },
  { id: 'invited', label: 'Invited, waiting', short: 'Waiting', emoji: '✉️' },
  { id: 'yes', label: 'Coming', short: 'Coming', emoji: '🎉' },
  { id: 'maybe', label: 'Maybe', short: 'Maybe', emoji: '🤔' },
  { id: 'no', label: "Can't come", short: "Can't", emoji: '😢' },
];

export const statusOf = (s: Rsvp) => STATUSES.find((x) => x.id === s)!;

export const CARD_STYLES: { id: CardStyle; label: string }[] = [
  { id: 'confetti', label: '🎊 Confetti' },
  { id: 'balloons', label: '🎈 Balloons' },
  { id: 'stars', label: '✨ Stars' },
];

// ---------------------------------------------------------------------------------------------
// New data

export const newSettings = (): Settings => ({ theme: 'light', name: '', phone: '', currency: '$' });

export const newData = (): Data => ({ version: 1, events: [], settings: newSettings() });

export function newEvent(kind: Kind = 'birthday'): PartyEvent {
  const now = Date.now();
  return {
    id: uid(),
    title: '',
    kind,
    emoji: kindOf(kind).emoji,
    place: { name: '' },
    cardStyle: 'confetti',
    guests: [],
    tasks: [],
    food: [],
    schedule: [],
    expenses: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function newGuest(name: string, adults = 1, kids = 0): Guest {
  return { id: uid(8), name, adults, kids, status: 'list' };
}

// ---------------------------------------------------------------------------------------------
// Dates. Event dates are local 'YYYY-MM-DD' strings so they never shift with time zones.

const pad = (n: number) => String(n).padStart(2, '0');

export const dateStr = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = (now = new Date()): string => dateStr(now);

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const addDays = (s: string, n: number): string => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dateStr(d);
};

/** Whole days from a to b (b later = positive). */
export const daysBetween = (a: string, b: string): number => Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);

export const fmtDate = (s: string): string => parseDate(s).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export const fmtShort = (s: string): string => parseDate(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export function fmtDateYear(s: string, today = todayStr()): string {
  const sameYear = s.slice(0, 4) === today.slice(0, 4);
  return parseDate(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: sameYear ? undefined : 'numeric' });
}

export function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${pad(m)} ${ap}` : `${h12} ${ap}`;
}

export function timeRange(start?: string, end?: string): string {
  if (!start) return '';
  if (!end) return fmtTime(start);
  const a = fmtTime(start);
  const b = fmtTime(end);
  // "2–4 PM" when both are in the same half of the day.
  if (a.slice(-2) === b.slice(-2)) return `${a.slice(0, -3)}–${b}`;
  return `${a} – ${b}`;
}

/** "today", "tomorrow", "in 5 days", "in 3 weeks", "yesterday", "4 days ago". */
export function relDays(n: number): string {
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  if (n < 0) return -n < 14 ? `${-n} days ago` : -n < 60 ? `${Math.round(-n / 7)} weeks ago` : `${Math.round(-n / 30)} months ago`;
  if (n < 14) return `in ${n} days`;
  if (n < 60) return `in ${Math.round(n / 7)} weeks`;
  return `in ${Math.round(n / 30)} months`;
}

export const daysUntil = (e: PartyEvent, today = todayStr()): number | undefined => (e.date ? daysBetween(today, e.date) : undefined);

export const isPast = (e: PartyEvent, today = todayStr()): boolean => !!e.date && e.date < today;

/** Upcoming first (soonest first, undated at the end), then past events (most recent first). */
export function sortEvents(events: PartyEvent[], today = todayStr()): { upcoming: PartyEvent[]; past: PartyEvent[] } {
  const upcoming = events
    .filter((e) => !isPast(e, today))
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999') || (a.start ?? '').localeCompare(b.start ?? '') || b.createdAt - a.createdAt);
  const past = events.filter((e) => isPast(e, today)).sort((a, b) => b.date!.localeCompare(a.date!));
  return { upcoming, past };
}

// ---------------------------------------------------------------------------------------------
// Titles

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const possessive = (name: string) => (/s$/i.test(name) ? `${name}'` : `${name}'s`);

/** A title from the honoree: "Ava's 7th Birthday", "Sam's Baby Shower", "Jo & Al's Anniversary". */
export function suggestTitle(kind: Kind, honoree?: string, age?: number): string {
  const who = honoree?.trim();
  if (!who) return '';
  const p = possessive(who);
  switch (kind) {
    case 'birthday':
      return age ? `${p} ${ordinal(age)} Birthday` : `${p} Birthday`;
    case 'shower':
      return `${p} Baby Shower`;
    case 'wedding':
      return age ? `${p} ${ordinal(age)} Anniversary` : `${p} Wedding`;
    case 'graduation':
      return `${p} Graduation Party`;
    case 'dinner':
      return `Dinner for ${who}`;
    default:
      return `${p} Party`;
  }
}

export const displayTitle = (e: PartyEvent): string => e.title.trim() || suggestTitle(e.kind, e.honoree, e.age) || `${kindOf(e.kind).label} plans`;

// ---------------------------------------------------------------------------------------------
// Headcount

export interface Count {
  households: number;
  adults: number;
  kids: number;
}

const zero = (): Count => ({ households: 0, adults: 0, kids: 0 });

export const people = (c: Count): number => c.adults + c.kids;

/** Who's coming from this household: the coming counts once they've said yes, else everyone invited. */
export function partyOf(g: Guest): { adults: number; kids: number } {
  if (g.status === 'yes') return { adults: g.comingAdults ?? g.adults, kids: g.comingKids ?? g.kids };
  return { adults: g.adults, kids: g.kids };
}

/** Totals per answer, plus `sent` (everyone who got an invitation, whatever they said) and `all`. */
export function headcount(e: PartyEvent): Record<Rsvp, Count> & { sent: Count; all: Count } {
  const out = { list: zero(), invited: zero(), yes: zero(), maybe: zero(), no: zero(), all: zero() } as Record<Rsvp, Count> & { all: Count };
  for (const g of e.guests) {
    const p = partyOf(g);
    for (const c of [out[g.status], out.all]) {
      c.households++;
      c.adults += p.adults;
      c.kids += p.kids;
    }
  }
  const sent = zero();
  for (const s of ['invited', 'yes', 'maybe', 'no'] as const) {
    sent.households += out[s].households;
    sent.adults += out[s].adults;
    sent.kids += out[s].kids;
  }
  return { ...out, sent };
}

/** "8 adults · 5 kids", "1 adult", "3 kids". */
export function countText(c: { adults: number; kids: number }): string {
  const parts: string[] = [];
  if (c.adults) parts.push(`${c.adults} adult${c.adults === 1 ? '' : 's'}`);
  if (c.kids) parts.push(`${c.kids} kid${c.kids === 1 ? '' : 's'}`);
  return parts.join(' · ') || 'nobody';
}

export function setStatus(g: Guest, s: Rsvp, now = Date.now()): void {
  if (g.status === s) return;
  if (s === 'list') {
    g.invitedAt = g.repliedAt = undefined;
  } else if (s === 'invited') {
    g.invitedAt ??= now;
    g.repliedAt = undefined;
  } else {
    g.invitedAt ??= now;
    g.repliedAt = now;
  }
  if (s !== 'yes') g.arrived = false;
  g.status = s;
}

/** RSVPs still out after the RSVP-by date. */
export function overdueRsvps(e: PartyEvent, today = todayStr()): number {
  if (!e.rsvpBy || e.rsvpBy >= today) return 0;
  return e.guests.filter((g) => g.status === 'invited').length;
}

/** Allergies and dietary needs of everyone who might come. */
export function dietNeeds(e: PartyEvent): { name: string; diet: string }[] {
  return e.guests.filter((g) => g.diet?.trim() && g.status !== 'no').map((g) => ({ name: g.name, diet: g.diet!.trim() }));
}

// ---------------------------------------------------------------------------------------------
// Adding guests from typed or pasted text, one household per line.
//   "The Smiths 2+2"         → 2 adults, 2 kids
//   "Grandma"                → 1 adult (or the defaults given)
//   "Liam, 1 adult 1 kid"    → 1 adult, 1 kid
//   "Mia (kid) 555-123-4567" → contact picked out of the line
// Bullets, numbering and blank lines are ignored.

export function parseGuestLines(text: string, defAdults = 1, defKids = 0): Guest[] {
  const out: Guest[] = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.replace(/^\s*(?:[-*•·]|\d+[.)])\s*/, '').trim();
    if (!line) continue;
    let contact: string | undefined;
    const email = line.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
    if (email) {
      contact = email[0];
      line = line.replace(email[0], ' ');
    } else {
      const phone = line.match(/\+?\(?\d[\d\s().-]{5,}\d/);
      if (phone && phone[0].replace(/\D/g, '').length >= 7) {
        contact = phone[0].trim();
        line = line.replace(phone[0], ' ');
      }
    }
    let adults = defAdults;
    let kids = defKids;
    let m: RegExpMatchArray | null;
    if ((m = line.match(/[\s,;:(-]*(\d+)\s*[+/&]\s*(\d+)\)?\s*$/))) {
      adults = +m[1];
      kids = +m[2];
      line = line.slice(0, m.index);
    } else {
      const a = line.match(/(\d+)\s*(?:adults?|grown[- ]?ups?|parents?)\b/i);
      const k = line.match(/(\d+)\s*(?:kids?|children|child)\b/i);
      if (a || k) {
        adults = a ? +a[1] : k ? 0 : defAdults;
        kids = k ? +k[1] : 0;
        line = line.replace(/(\d+)\s*(?:adults?|grown[- ]?ups?|parents?|kids?|children|child)\b/gi, ' ');
      } else if ((m = line.match(/\(\s*kid\s*\)|\bkid\b\s*$/i))) {
        adults = 0;
        kids = 1;
        line = line.replace(m[0], ' ');
      } else if ((m = line.match(/[\s,;:(-]+(\d{1,2})\)?\s*$/))) {
        adults = +m[1];
        kids = 0;
        line = line.slice(0, m.index);
      }
    }
    const name = line.replace(/[\s,;:()&+-]+$/, '').replace(/^[\s,;:()-]+/, '').replace(/\s{2,}/g, ' ').trim();
    if (!name) continue;
    const g = newGuest(name, Math.min(adults, 50), Math.min(kids, 50));
    if (contact) g.contact = contact;
    out.push(g);
  }
  return out;
}

/** Households from other events, newest copy of each name first, for "Add from past events". */
export function pastGuests(d: Data, excludeEventId?: string): { guest: Guest; from: string }[] {
  const seen = new Set<string>();
  const out: { guest: Guest; from: string }[] = [];
  const events = [...d.events].filter((e) => e.id !== excludeEventId).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.updatedAt - a.updatedAt);
  for (const e of events)
    for (const g of e.guests) {
      const key = g.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ guest: g, from: displayTitle(e) });
    }
  return out.sort((a, b) => a.guest.name.localeCompare(b.guest.name));
}

/** A household copied into another event: same people and contact, fresh invitation. */
export function copyGuest(g: Guest): Guest {
  const c = newGuest(g.name, g.adults, g.kids);
  if (g.contact) c.contact = g.contact;
  if (g.diet) c.diet = g.diet;
  if (g.notes) c.notes = g.notes;
  return c;
}

/** Places used by other events, for the location picker. */
export function savedPlaces(d: Data, excludeEventId?: string): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const e of [...d.events].sort((a, b) => b.updatedAt - a.updatedAt)) {
    if (e.id === excludeEventId) continue;
    const key = e.place.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...e.place });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// To-dos. Due dates are "days before the event", so they move when the date does.

export const taskDue = (e: PartyEvent, t: Task): string | undefined => (e.date && t.before !== undefined ? addDays(e.date, -t.before) : undefined);

export function newTask(text: string, before?: number): Task {
  return { id: uid(8), text, before, done: false };
}

type Template = [string, number][];

const BIRTHDAY: Template = [
  ['Pick a date and a theme', 42],
  ['Book the place', 35],
  ['Make the guest list', 35],
  ['Send the invitations', 21],
  ['Order the cake', 10],
  ['Buy decorations', 10],
  ['Plan games and activities', 10],
  ['Get party favors / goodie bags', 7],
  ['Follow up on missing RSVPs', 5],
  ['Confirm the final headcount', 3],
  ['Buy food and drinks', 2],
  ['Candles, lighter, plates, napkins', 2],
  ['Charge the camera / phone', 1],
  ['Set up and decorate', 0],
  ['Send thank-you notes', -7],
];

const PARTY: Template = [
  ['Pick a date', 35],
  ['Make the guest list', 30],
  ['Send the invitations', 21],
  ['Plan the menu', 14],
  ['Buy decorations', 10],
  ['Follow up on missing RSVPs', 5],
  ['Grocery shopping', 2],
  ['Clean and set up', 1],
  ['Send thank-yous', -5],
];

const SHOWER: Template = [
  ['Pick a date with the parents-to-be', 42],
  ['Book the place', 35],
  ['Make the guest list', 35],
  ['Send the invitations (with registry info)', 28],
  ['Plan games and prizes', 14],
  ['Order the cake', 10],
  ['Buy decorations', 10],
  ['Follow up on missing RSVPs', 7],
  ['Buy food and drinks', 2],
  ['Set up and decorate', 0],
  ['Help with thank-you notes', -7],
];

const DINNER: Template = [
  ['Invite everyone', 14],
  ['Plan the menu', 7],
  ['Check allergies and dietary needs', 7],
  ['Grocery shopping', 1],
  ['Clean and set the table', 0],
];

export function starterTasks(kind: Kind): Task[] {
  const t = kind === 'birthday' || kind === 'graduation' ? BIRTHDAY : kind === 'shower' ? SHOWER : kind === 'dinner' ? DINNER : PARTY;
  return t.map(([text, before]) => newTask(text, before));
}

/** A typical party timeline from the start time. */
export function sampleSchedule(e: PartyEvent): Slot[] {
  const start = e.start ?? '14:00';
  const [h, m] = start.split(':').map(Number);
  const at = (min: number) => {
    const t = h * 60 + m + min;
    return `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`;
  };
  const steps: [number, string][] =
    e.kind === 'birthday'
      ? [
          [-60, 'Set up and decorate'],
          [0, 'Guests arrive'],
          [15, 'Games and activities'],
          [60, 'Food'],
          [90, 'Cake and singing 🎂'],
          [105, 'Presents'],
          [120, 'Goodbyes and goodie bags'],
        ]
      : [
          [-60, 'Set up'],
          [0, 'Guests arrive'],
          [30, 'Food'],
          [90, 'Toasts / dessert'],
          [150, 'Wrap up'],
        ];
  return steps.map(([min, text]) => ({ id: uid(8), time: at(min), text }));
}

export const sortSchedule = (s: Slot[]): Slot[] => [...s].sort((a, b) => a.time.localeCompare(b.time));

/** Open to-dos across upcoming events, soonest due first (undated last). */
export function allTasks(d: Data, today = todayStr()): { e: PartyEvent; t: Task; due?: string }[] {
  const out: { e: PartyEvent; t: Task; due?: string }[] = [];
  for (const e of sortEvents(d.events, today).upcoming) for (const t of e.tasks) if (!t.done) out.push({ e, t, due: taskDue(e, t) });
  return out.sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'));
}

// ---------------------------------------------------------------------------------------------
// Invitations

export function whenLine(e: PartyEvent): string {
  return [e.date ? fmtDate(e.date) : '', timeRange(e.start, e.end)].filter(Boolean).join(' · ');
}

export function placeLine(p: Place): string {
  return [p.name.trim(), p.address?.trim()].filter(Boolean).join(', ');
}

export function rsvpLine(e: PartyEvent, s: Settings): string {
  const who = [s.name.trim(), s.phone.trim() && `(${s.phone.trim()})`].filter(Boolean).join(' ');
  if (!e.rsvpBy && !who) return 'Please let us know if you can make it!';
  return `Please RSVP${e.rsvpBy ? ` by ${fmtDate(e.rsvpBy)}` : ''}${who ? ` to ${who}` : ''}.`;
}

/** The invitation message written from the event details. */
export function generatedInvite(e: PartyEvent, s: Settings): string {
  const lines = [`${e.emoji} You're invited to ${displayTitle(e)}!`];
  const when = whenLine(e);
  if (when) lines.push(`📅 ${when}`);
  const where = placeLine(e.place);
  if (where) lines.push(`📍 ${where}`);
  if (e.place.notes?.trim()) lines.push(e.place.notes.trim());
  if (e.theme?.trim()) lines.push(`🎨 Theme: ${e.theme.trim()}`);
  if (e.inviteNote?.trim()) lines.push(e.inviteNote.trim());
  lines.push('', rsvpLine(e, s));
  return lines.join('\n');
}

export const inviteText = (e: PartyEvent, s: Settings): string => e.inviteText?.trim() || generatedInvite(e, s);

/** Greets the household by name at the top of a one-to-one invitation. */
export function personalInvite(e: PartyEvent, s: Settings, g: Guest): string {
  const first = g.name.replace(/^the\s+/i, '').trim();
  return `Hi ${first}!\n\n${inviteText(e, s)}`;
}

export function contactKind(c?: string): 'email' | 'phone' | undefined {
  if (!c?.trim()) return undefined;
  if (/@/.test(c)) return 'email';
  if (c.replace(/\D/g, '').length >= 7) return 'phone';
  return undefined;
}

/** Opens Messages / Mail with the invitation filled in. */
export function sendUrl(contact: string, subject: string, body: string): string | undefined {
  const k = contactKind(contact);
  if (k === 'email') return `mailto:${encodeURIComponent(contact.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (k === 'phone') return `sms:${contact.replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(body)}`;
  return undefined;
}

export function mapsUrl(p: Place, apple: boolean): string {
  const q = encodeURIComponent(placeLine(p));
  return apple ? `https://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// ---------------------------------------------------------------------------------------------
// Food

export function newFood(name: string, kind: Food['kind'], guestId?: string): Food {
  return { id: uid(8), name, kind, guestId, done: false };
}

// ---------------------------------------------------------------------------------------------
// Budget

export function budgetTotals(e: PartyEvent): { planned: number; paid: number; owed: number; left?: number } {
  let planned = 0;
  let paid = 0;
  for (const x of e.expenses) {
    planned += x.amount ?? 0;
    if (x.paid) paid += x.amount ?? 0;
  }
  return { planned, paid, owed: planned - paid, left: e.budget !== undefined ? e.budget - planned : undefined };
}

export function fmtMoney(n: number, cur = '$'): string {
  const neg = n < 0;
  const v = Math.abs(n);
  const s = v % 1 ? v.toFixed(2) : v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return `${neg ? '−' : ''}${cur}${s}`;
}

export function newExpense(name: string, amount?: number): Expense {
  return { id: uid(8), name, amount, paid: false };
}

export const EXPENSE_IDEAS = ['Place / venue', 'Cake', 'Food', 'Drinks', 'Decorations', 'Party favors', 'Entertainment', 'Invitations', 'Plates & cups'];

// ---------------------------------------------------------------------------------------------
// Duplicate ("Plan another like this"): same guests, checklist, menu, schedule and budget lines,
// with every answer, check-off and payment reset. The date is left for you to pick.

export function duplicateEvent(e: PartyEvent): PartyEvent {
  const now = Date.now();
  const c: PartyEvent = JSON.parse(JSON.stringify(e));
  c.id = uid();
  c.title = e.title ? `${e.title} (copy)` : '';
  c.date = c.rsvpBy = undefined;
  if (c.age) c.age++;
  c.createdAt = c.updatedAt = now;
  const ids = new Map<string, string>();
  c.guests = e.guests.map((g) => {
    const n = copyGuest(g);
    ids.set(g.id, n.id);
    return n;
  });
  c.tasks = e.tasks.map((t) => newTask(t.text, t.before));
  c.food = e.food.map((f) => ({ ...newFood(f.name, f.kind, f.guestId && ids.get(f.guestId)), qty: f.qty }));
  c.schedule = e.schedule.map((s) => ({ ...s, id: uid(8) }));
  c.expenses = e.expenses.map((x) => newExpense(x.name, x.amount));
  return c;
}

// ---------------------------------------------------------------------------------------------
// Backup

export function normalize(raw: unknown): Data {
  const d = (raw ?? {}) as Partial<Data>;
  const out = newData();
  out.settings = { ...out.settings, ...(d.settings ?? {}) };
  out.events = (Array.isArray(d.events) ? d.events : []).filter((e) => e && typeof e.id === 'string').map(normalizeEvent);
  return out;
}

function normalizeEvent(e: PartyEvent): PartyEvent {
  const base = newEvent(KINDS.some((k) => k.id === e.kind) ? e.kind : 'other');
  const out = { ...base, ...e };
  out.place = { ...base.place, ...(e.place ?? {}) };
  out.guests = (e.guests ?? []).map((g) => ({ ...g, adults: g.adults ?? 1, kids: g.kids ?? 0, status: STATUSES.some((s) => s.id === g.status) ? g.status : 'list' }));
  out.tasks = (e.tasks ?? []).map((t) => ({ ...t, done: !!t.done }));
  out.food = (e.food ?? []).map((f) => ({ ...f, kind: f.kind === 'bring' ? 'bring' : 'menu', done: !!f.done }));
  out.schedule = e.schedule ?? [];
  out.expenses = (e.expenses ?? []).map((x) => ({ ...x, paid: !!x.paid }));
  if (!CARD_STYLES.some((c) => c.id === out.cardStyle)) out.cardStyle = 'confetti';
  return out;
}

export const backupJson = (d: Data): string => JSON.stringify({ app: 'milkseventplanner', ...d });

export function parseBackup(text: string): Data {
  let raw: { app?: string; events?: unknown };
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a backup (it couldn't be read).");
  }
  if (raw?.app !== 'milkseventplanner' || !Array.isArray(raw.events)) throw new Error("That file isn't a Milk's Event Planner backup.");
  return normalize(raw);
}

// ---------------------------------------------------------------------------------------------
// Calendar (.ics) for the event itself, with a reminder the day before.

const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => '\\' + c);

export function icsFor(e: PartyEvent, now = new Date()): string | undefined {
  if (!e.date) return undefined;
  const d = e.date.replace(/-/g, '');
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', "PRODID:-//Milk's Event Planner//EN", 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${e.id}@milkseventplanner`, `DTSTAMP:${stamp}`];
  if (e.start) {
    const t = (x: string) => x.replace(':', '') + '00';
    lines.push(`DTSTART:${d}T${t(e.start)}`);
    let endDate = d;
    if (e.end && e.end < e.start) endDate = addDays(e.date, 1).replace(/-/g, '');
    lines.push(`DTEND:${endDate}T${t(e.end ?? sampleEnd(e.start))}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${addDays(e.date, 1).replace(/-/g, '')}`);
  }
  lines.push(`SUMMARY:${icsEscape(`${e.emoji} ${displayTitle(e)}`)}`);
  const where = placeLine(e.place);
  if (where) lines.push(`LOCATION:${icsEscape(where)}`);
  if (e.place.notes?.trim()) lines.push(`DESCRIPTION:${icsEscape(e.place.notes.trim())}`);
  lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(displayTitle(e))}`, 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

function sampleEnd(start: string): string {
  const [h, m] = start.split(':').map(Number);
  return `${pad(Math.min(h + 2, 23))}:${pad(m)}`;
}

/** Moves an item within an array (drag to reorder). */
export function move<T>(a: T[], from: number, to: number): void {
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x);
}
