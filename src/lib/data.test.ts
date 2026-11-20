import { describe, expect, it } from 'vitest';
import {
  addDays,
  backupJson,
  budgetTotals,
  daysBetween,
  duplicateEvent,
  generatedInvite,
  headcount,
  icsFor,
  newData,
  newEvent,
  newExpense,
  newGuest,
  newSettings,
  newTask,
  ordinal,
  overdueRsvps,
  parseBackup,
  parseGuestLines,
  pastGuests,
  relDays,
  sendUrl,
  setStatus,
  sortEvents,
  starterTasks,
  suggestTitle,
  taskDue,
  timeRange,
} from './data';

describe('dates', () => {
  it('adds days across months and counts days between', () => {
    expect(addDays('2026-11-28', 5)).toBe('2026-12-03');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-11-20', '2026-12-12')).toBe(22);
  });
  it('formats time ranges compactly', () => {
    expect(timeRange('14:00', '16:00')).toBe('2–4 PM');
    expect(timeRange('11:30', '13:00')).toBe('11:30 AM – 1 PM');
    expect(timeRange('18:00')).toBe('6 PM');
    expect(timeRange()).toBe('');
  });
  it('says relative days in words', () => {
    expect(relDays(0)).toBe('today');
    expect(relDays(1)).toBe('tomorrow');
    expect(relDays(5)).toBe('in 5 days');
    expect(relDays(21)).toBe('in 3 weeks');
    expect(relDays(-3)).toBe('3 days ago');
  });
  it('sorts upcoming soonest first and past most recent first', () => {
    const a = { ...newEvent(), date: '2026-12-12' };
    const b = { ...newEvent(), date: '2026-11-25' };
    const c = newEvent();
    const p1 = { ...newEvent(), date: '2026-10-01' };
    const p2 = { ...newEvent(), date: '2026-11-01' };
    const { upcoming, past } = sortEvents([a, b, c, p1, p2], '2026-11-20');
    expect(upcoming.map((e) => e.id)).toEqual([b.id, a.id, c.id]);
    expect(past.map((e) => e.id)).toEqual([p2.id, p1.id]);
  });
});

describe('titles', () => {
  it('builds a title from the honoree', () => {
    expect(suggestTitle('birthday', 'Ava', 7)).toBe("Ava's 7th Birthday");
    expect(suggestTitle('birthday', 'James', 1)).toBe("James' 1st Birthday");
    expect(suggestTitle('shower', 'Sam')).toBe("Sam's Baby Shower");
    expect(suggestTitle('party')).toBe('');
    expect([11, 12, 13, 21, 22, 23, 102].map(ordinal)).toEqual(['11th', '12th', '13th', '21st', '22nd', '23rd', '102nd']);
  });
});

describe('guest list', () => {
  it('reads households, counts and contacts from pasted lines', () => {
    const g = parseGuestLines(`The Smiths 2+2
- Grandma
1. Liam, 1 adult 1 kid
Mia (kid) 555-123-4567
Jo & Al jo@example.com 2

`);
    expect(g.map((x) => [x.name, x.adults, x.kids, x.contact])).toEqual([
      ['The Smiths', 2, 2, undefined],
      ['Grandma', 1, 0, undefined],
      ['Liam', 1, 1, undefined],
      ['Mia', 0, 1, '555-123-4567'],
      ['Jo & Al', 2, 0, 'jo@example.com'],
    ]);
  });
  it('uses the defaults when no count is given', () => {
    expect(parseGuestLines('Noah', 1, 1)[0]).toMatchObject({ name: 'Noah', adults: 1, kids: 1 });
    expect(parseGuestLines('Emma 3 kids')[0]).toMatchObject({ name: 'Emma', adults: 0, kids: 3 });
  });

  it('totals the headcount, using coming counts once they say yes', () => {
    const e = newEvent();
    const a = newGuest('A', 2, 2);
    const b = newGuest('B', 1, 1);
    const c = newGuest('C', 2, 0);
    const d = newGuest('D', 1, 0);
    setStatus(a, 'yes');
    a.comingAdults = 1; // one parent drops off
    setStatus(b, 'maybe');
    setStatus(c, 'invited');
    e.guests = [a, b, c, d];
    const h = headcount(e);
    expect(h.yes).toEqual({ households: 1, adults: 1, kids: 2 });
    expect(h.maybe).toEqual({ households: 1, adults: 1, kids: 1 });
    expect(h.sent.households).toBe(3);
    expect(h.invited.households).toBe(1);
    expect(h.list.households).toBe(1);
  });

  it('dates answers and clears them when moved back', () => {
    const g = newGuest('A');
    setStatus(g, 'yes', 100);
    expect(g.invitedAt).toBe(100);
    expect(g.repliedAt).toBe(100);
    g.arrived = true;
    setStatus(g, 'invited', 200);
    expect(g.repliedAt).toBeUndefined();
    expect(g.arrived).toBe(false);
    setStatus(g, 'list');
    expect(g.invitedAt).toBeUndefined();
  });

  it('counts RSVPs still out after the RSVP date', () => {
    const e = { ...newEvent(), rsvpBy: '2026-11-15' };
    const g = newGuest('A');
    setStatus(g, 'invited');
    e.guests = [g, newGuest('B')];
    expect(overdueRsvps(e, '2026-11-20')).toBe(1);
    expect(overdueRsvps(e, '2026-11-10')).toBe(0);
  });

  it('offers guests from other events once each', () => {
    const d = newData();
    const e1 = { ...newEvent(), date: '2025-12-01', guests: [newGuest('Smiths', 2, 2)] };
    const e2 = { ...newEvent(), date: '2026-06-01', guests: [newGuest('smiths', 2, 3), newGuest('Lee')] };
    const e3 = newEvent();
    d.events = [e1, e2, e3];
    const p = pastGuests(d, e3.id);
    expect(p.map((x) => [x.guest.name, x.guest.kids])).toEqual([
      ['Lee', 0],
      ['smiths', 3],
    ]);
  });
});

describe('to-dos', () => {
  it('moves due dates with the event date', () => {
    const e = { ...newEvent(), date: '2026-12-12' };
    const t = newTask('Send invites', 21);
    expect(taskDue(e, t)).toBe('2026-11-21');
    e.date = '2026-12-19';
    expect(taskDue(e, t)).toBe('2026-11-28');
    expect(taskDue({ ...e, date: undefined }, t)).toBeUndefined();
  });
  it('has a starter checklist per kind', () => {
    expect(starterTasks('birthday').some((t) => /cake/i.test(t.text))).toBe(true);
    expect(starterTasks('dinner').length).toBeLessThan(starterTasks('birthday').length);
  });
});

describe('invitations', () => {
  it('writes the invitation from the details', () => {
    const e = {
      ...newEvent('birthday'),
      honoree: 'Ava',
      age: 7,
      date: '2026-12-12',
      start: '14:00',
      end: '16:00',
      rsvpBy: '2026-12-05',
      place: { name: 'Jump Zone', address: '123 Main St', notes: 'Socks required' },
    };
    const s = { ...newSettings(), name: 'Milk', phone: '555-0100' };
    const text = generatedInvite(e, s);
    expect(text).toContain("You're invited to Ava's 7th Birthday!");
    expect(text).toContain('2–4 PM');
    expect(text).toContain('📍 Jump Zone, 123 Main St');
    expect(text).toContain('Socks required');
    expect(text).toMatch(/Please RSVP by .+ to Milk \(555-0100\)\./);
  });
  it('makes a text or email link from the contact', () => {
    expect(sendUrl('(555) 123-4567', 'Hi', 'Come!')).toBe('sms:5551234567?&body=Come!');
    expect(sendUrl('a@b.co', 'Party', 'Come!')).toBe('mailto:a%40b.co?subject=Party&body=Come!');
    expect(sendUrl('call me', 'x', 'y')).toBeUndefined();
  });
});

describe('budget', () => {
  it('totals planned, paid and what is left', () => {
    const e = { ...newEvent(), budget: 300, expenses: [newExpense('Cake', 60), newExpense('Venue', 200), newExpense('Balloons')] };
    e.expenses[1].paid = true;
    expect(budgetTotals(e)).toEqual({ planned: 260, paid: 200, owed: 60, left: 40 });
  });
});

describe('duplicate', () => {
  it('copies everything with answers and check-offs reset', () => {
    const e = { ...newEvent('birthday'), honoree: 'Ava', age: 7, date: '2026-12-12' };
    const g = newGuest('Smiths', 2, 2);
    setStatus(g, 'yes');
    g.arrived = g.thanked = true;
    g.gift = 'Lego';
    e.guests = [g];
    e.tasks = [{ ...newTask('Cake', 10), done: true }];
    e.food = [{ id: 'f', name: 'Chips', kind: 'bring', guestId: g.id, done: true }];
    e.expenses = [{ ...newExpense('Cake', 50), paid: true }];
    const c = duplicateEvent(e);
    expect(c.id).not.toBe(e.id);
    expect(c.date).toBeUndefined();
    expect(c.age).toBe(8);
    expect(c.guests[0]).toMatchObject({ name: 'Smiths', adults: 2, kids: 2, status: 'list' });
    expect(c.guests[0].gift).toBeUndefined();
    expect(c.tasks[0]).toMatchObject({ text: 'Cake', before: 10, done: false });
    expect(c.food[0].guestId).toBe(c.guests[0].id);
    expect(c.food[0].done).toBe(false);
    expect(c.expenses[0]).toMatchObject({ amount: 50, paid: false });
  });
});

describe('backup and calendar', () => {
  it('round-trips a backup and rejects other files', () => {
    const d = newData();
    d.events.push({ ...newEvent(), title: 'BBQ' });
    const back = parseBackup(backupJson(d));
    expect(back.events[0].title).toBe('BBQ');
    expect(() => parseBackup('{"events":[]}')).toThrow();
    expect(() => parseBackup('nope')).toThrow();
  });
  it('fills in fields missing from older or hand-edited backups', () => {
    const back = parseBackup(JSON.stringify({ app: 'milkseventplanner', events: [{ id: 'x', title: 'T', kind: 'party', guests: [{ id: 'g', name: 'A' }] }] }));
    expect(back.events[0].tasks).toEqual([]);
    expect(back.events[0].guests[0]).toMatchObject({ adults: 1, kids: 0, status: 'list' });
    expect(back.settings.currency).toBe('$');
  });
  it('writes a calendar file with times, place and a reminder', () => {
    const e = { ...newEvent(), title: 'BBQ, at ours', date: '2026-07-04', start: '17:00', end: '21:30', place: { name: 'Home' } };
    const ics = icsFor(e)!;
    expect(ics).toContain('DTSTART:20260704T170000');
    expect(ics).toContain('DTEND:20260704T213000');
    expect(ics).toContain('SUMMARY:🎂 BBQ\\, at ours');
    expect(ics).toContain('LOCATION:Home');
    expect(ics).toContain('TRIGGER:-P1D');
    expect(icsFor({ ...e, start: undefined })).toContain('DTSTART;VALUE=DATE:20260704');
    expect(icsFor({ ...e, date: undefined })).toBeUndefined();
  });
});
