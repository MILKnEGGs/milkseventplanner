// Saved data shapes. Everything lives in one record in this browser's IndexedDB.

export type ThemeMode = 'light' | 'dark' | 'auto';

/** Where a household is with their invitation. Guests never RSVP through the app; you set this. */
export type Rsvp = 'list' | 'invited' | 'yes' | 'maybe' | 'no';

export type Kind = 'birthday' | 'party' | 'holiday' | 'shower' | 'wedding' | 'dinner' | 'cookout' | 'graduation' | 'other';

export type CardStyle = 'confetti' | 'balloons' | 'stars';

/** One invitation: a household (or a single person) with how many adults and kids are invited. */
export interface Guest {
  id: string;
  name: string;
  /** Phone or email, used for "Send invite". */
  contact?: string;
  adults: number;
  kids: number;
  status: Rsvp;
  /** How many are actually coming, once they say yes (defaults to everyone invited). */
  comingAdults?: number;
  comingKids?: number;
  invitedAt?: number;
  repliedAt?: number;
  /** Allergies and dietary needs. */
  diet?: string;
  notes?: string;
  /** Day-of check-in. */
  arrived?: boolean;
  /** After the party: what they gave and whether a thank-you went out. */
  gift?: string;
  thanked?: boolean;
}

export interface Task {
  id: string;
  text: string;
  /** Due this many days before the event (negative = after). Moves with the event date. */
  before?: number;
  done: boolean;
}

export interface Food {
  id: string;
  name: string;
  /** 'menu': you're making or buying it. 'bring': a guest is bringing it. */
  kind: 'menu' | 'bring';
  /** Guest bringing it (kind 'bring'). */
  guestId?: string;
  qty?: string;
  /** Bought / made / arrived. */
  done: boolean;
}

export interface Slot {
  id: string;
  /** 'HH:MM' */
  time: string;
  text: string;
}

export interface Expense {
  id: string;
  name: string;
  amount?: number;
  paid: boolean;
}

export interface Place {
  name: string;
  address?: string;
  /** Parking, which door, "bring a swimsuit"… shown on the invite. */
  notes?: string;
}

export interface PartyEvent {
  id: string;
  title: string;
  kind: Kind;
  emoji: string;
  /** Who it's for ("Ava") and, for birthdays, the age they're turning. */
  honoree?: string;
  age?: number;
  /** 'YYYY-MM-DD' (local) */
  date?: string;
  /** 'HH:MM' */
  start?: string;
  end?: string;
  rsvpBy?: string;
  place: Place;
  /** Party theme ("Dinosaurs"). */
  theme?: string;
  notes?: string;
  /** Invitation wording; empty = written from the event details. */
  inviteText?: string;
  /** Extra line added to the generated invitation ("Swimsuits welcome!"). */
  inviteNote?: string;
  cardStyle: CardStyle;
  guests: Guest[];
  tasks: Task[];
  food: Food[];
  schedule: Slot[];
  budget?: number;
  expenses: Expense[];
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  theme: ThemeMode;
  /** Your name and phone for "RSVP to …" on invitations. */
  name: string;
  phone: string;
  currency: string;
}

export interface Data {
  version: 1;
  events: PartyEvent[];
  settings: Settings;
}
