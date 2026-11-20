// The invitation card: a picture drawn on a canvas from the event details, to share by text or print.
// Three looks. The scattered decorations are seeded by the event id so a card looks the same every time.

import { displayTitle, fmtDate, rsvpLine, timeRange } from './data';
import type { CardStyle, PartyEvent, Settings } from './types';

const W = 1080;
const H = 1350;

interface Look {
  bg: string | ((c: CanvasRenderingContext2D) => void);
  kicker: string;
  title: string;
  text: string;
  muted: string;
  rule: string;
  deco: (c: CanvasRenderingContext2D, rnd: () => number) => void;
}

function seeded(seed: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Decorations stay near the edges so the words in the middle stay readable. */
function edgePoint(rnd: () => number): [number, number] {
  for (;;) {
    const x = rnd() * W;
    const y = rnd() * H;
    const inner = x > 100 && x < W - 100 && y > 120 && y < H - 70;
    if (!inner) return [x, y];
  }
}

const CONFETTI = ['#e8356f', '#ffc93c', '#2bb7a6', '#7a3a86', '#ff8a5c', '#5b8def'];

const LOOKS: Record<CardStyle, Look> = {
  confetti: {
    bg: '#fff7ee',
    kicker: '#d92a66',
    title: '#4a1d4f',
    text: '#2d1631',
    muted: '#7a6270',
    rule: '#f3c9d6',
    deco(c, rnd) {
      for (let i = 0; i < 110; i++) {
        const [x, y] = edgePoint(rnd);
        c.save();
        c.translate(x, y);
        c.rotate(rnd() * Math.PI);
        c.fillStyle = CONFETTI[Math.floor(rnd() * CONFETTI.length)];
        if (rnd() < 0.45) {
          c.beginPath();
          c.arc(0, 0, 6 + rnd() * 8, 0, Math.PI * 2);
          c.fill();
        } else {
          c.beginPath();
          c.roundRect(-14, -5, 28 + rnd() * 10, 10, 5);
          c.fill();
        }
        c.restore();
      }
    },
  },
  balloons: {
    bg(c) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#f6efff');
      g.addColorStop(1, '#fff1f4');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    },
    kicker: '#8a4fd1',
    title: '#4a2a7a',
    text: '#33244d',
    muted: '#76688f',
    rule: '#dccdf5',
    deco(c, rnd) {
      const colors = ['#ff8fb1', '#ffd36e', '#7fd8cf', '#b79cff', '#8fc3ff'];
      const balloon = (x: number, y: number, r: number, col: string) => {
        c.strokeStyle = '#b4a6c9';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x, y + r * 1.2);
        c.bezierCurveTo(x - 20, y + r * 1.8, x + 20, y + r * 2.3, x - 6, y + r * 3.2);
        c.stroke();
        c.fillStyle = col;
        c.beginPath();
        c.ellipse(x, y, r, r * 1.18, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(x - 10, y + r * 1.28);
        c.lineTo(x + 10, y + r * 1.28);
        c.lineTo(x, y + r * 1.12);
        c.fill();
        c.fillStyle = 'rgb(255 255 255 / 45%)';
        c.beginPath();
        c.ellipse(x - r * 0.38, y - r * 0.42, r * 0.16, r * 0.28, -0.5, 0, Math.PI * 2);
        c.fill();
      };
      const spots: [number, number, number][] = [
        [90, 150, 70],
        [200, 90, 58],
        [990, 140, 70],
        [880, 80, 56],
        [70, 1180, 54],
        [1010, 1170, 58],
      ];
      spots.forEach(([x, y, r], i) => balloon(x, y, r, colors[(i + Math.floor(rnd() * 5)) % colors.length]));
      for (let i = 0; i < 40; i++) {
        const [x, y] = edgePoint(rnd);
        c.fillStyle = colors[Math.floor(rnd() * colors.length)];
        c.globalAlpha = 0.6;
        c.beginPath();
        c.arc(x, y, 5 + rnd() * 5, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
      }
    },
  },
  stars: {
    bg(c) {
      const g = c.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H / 2, H * 0.8);
      g.addColorStop(0, '#2c1a4f');
      g.addColorStop(1, '#120a24');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    },
    kicker: '#ffd35c',
    title: '#ffffff',
    text: '#f3eafc',
    muted: '#c3b4dc',
    rule: '#4d3a73',
    deco(c, rnd) {
      const star = (x: number, y: number, r: number) => {
        c.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const rr = i % 2 ? r * 0.45 : r;
          c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        c.closePath();
        c.fill();
      };
      for (let i = 0; i < 90; i++) {
        const [x, y] = edgePoint(rnd);
        c.fillStyle = rnd() < 0.3 ? '#ffd35c' : '#ffffff';
        c.globalAlpha = 0.4 + rnd() * 0.6;
        if (rnd() < 0.3) star(x, y, 10 + rnd() * 14);
        else {
          c.beginPath();
          c.arc(x, y, 2 + rnd() * 3, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.globalAlpha = 1;
    },
  },
};

function wrap(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (c.measureText(test).width > maxW && line) {
        out.push(line);
        line = word;
      } else line = test;
    }
    if (line) out.push(line);
  }
  return out;
}

async function fontsReady(): Promise<void> {
  try {
    await Promise.all(['700 100px Fredoka', '600 40px Fredoka', '700 40px Nunito', '400 40px Nunito'].map((f) => document.fonts.load(f)));
  } catch {
    // Falls back to the system font.
  }
}

export async function drawCard(canvas: HTMLCanvasElement, e: PartyEvent, s: Settings): Promise<void> {
  await fontsReady();
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d')!;
  const look = LOOKS[e.cardStyle] ?? LOOKS.confetti;
  if (typeof look.bg === 'string') {
    c.fillStyle = look.bg;
    c.fillRect(0, 0, W, H);
  } else look.bg(c);
  look.deco(c, seeded(e.id));

  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  const cx = W / 2;
  const maxW = W - 300;

  // Lay out the words first so the block can be centred vertically.
  const blocks: { font: string; color: string; lines: string[]; lh: number; gapAfter: number }[] = [];
  const add = (font: string, color: string, text: string, lh: number, gapAfter = 0) => {
    c.font = font;
    blocks.push({ font, color, lines: wrap(c, text, maxW), lh, gapAfter });
  };

  add('600 40px Fredoka', look.kicker, "YOU'RE INVITED", 50, 24);
  add('400 120px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif', look.text, e.emoji, 130, 18);

  // The title gets as big as fits in three lines.
  const title = displayTitle(e);
  let size = 112;
  for (; size > 56; size -= 6) {
    c.font = `700 ${size}px Fredoka`;
    if (wrap(c, title, maxW).length <= (size > 90 ? 2 : 3)) break;
  }
  add(`700 ${size}px Fredoka`, look.title, title, size * 1.08, 20);
  if (e.theme?.trim()) add('600 40px Fredoka', look.kicker, e.theme.trim(), 50, 10);

  const rule = blocks.length;
  if (e.date) add('700 48px Nunito', look.text, fmtDate(e.date), 60, 0);
  const time = timeRange(e.start, e.end);
  if (time) add('400 44px Nunito', look.text, time, 56, 0);
  const placeName = e.place.name.trim();
  const addr = e.place.address?.trim();
  if (placeName || addr) {
    if (blocks.length > rule) blocks[blocks.length - 1].gapAfter = 30;
    if (placeName) add('700 44px Nunito', look.text, placeName, 56, 0);
    if (addr) add('400 38px Nunito', look.muted, addr, 48, 0);
  }
  if (e.place.notes?.trim()) {
    blocks[blocks.length - 1].gapAfter = 24;
    add('400 36px Nunito', look.muted, e.place.notes.trim(), 46, 0);
  }
  if (e.inviteNote?.trim()) {
    blocks[blocks.length - 1].gapAfter = 24;
    add('600 38px Fredoka', look.kicker, e.inviteNote.trim(), 48, 0);
  }
  blocks[blocks.length - 1].gapAfter = 40;
  const rsvpAt = blocks.length;
  add('700 36px Nunito', look.text, rsvpLine(e, s), 46, 0);

  const RULE_SPACE = 60;
  const total = blocks.reduce((n, b) => n + b.lines.length * b.lh + b.gapAfter, 0) + RULE_SPACE * 2;
  let y = Math.max(170, (H - total) / 2);
  blocks.forEach((b, i) => {
    if (i === rule || i === rsvpAt) {
      c.strokeStyle = look.rule;
      c.lineWidth = 4;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx - 90, y + RULE_SPACE / 2 - 10);
      c.lineTo(cx + 90, y + RULE_SPACE / 2 - 10);
      c.stroke();
      y += RULE_SPACE;
    }
    c.font = b.font;
    c.fillStyle = b.color;
    for (const line of b.lines) {
      y += b.lh;
      c.fillText(line, cx, y - b.lh * 0.22);
    }
    y += b.gapAfter;
  });
}

export function canvasFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(new File([b], name, { type: 'image/png' })) : reject(new Error('Could not make the picture'))), 'image/png'),
  );
}

export const cardFileName = (e: PartyEvent): string =>
  `${displayTitle(e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'invitation'}-invite.png`;

