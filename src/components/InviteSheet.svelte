<script lang="ts">
  import { copyText } from '../lib/actions';
  import { canvasFile, cardFileName, drawCard } from '../lib/card';
  import { CARD_STYLES, contactKind, displayTitle, generatedInvite, inviteText, personalInvite, sendUrl, setStatus } from '../lib/data';
  import { download, shareFile } from '../lib/files';
  import { app, toast, touch } from '../lib/store.svelte';
  import type { Guest, PartyEvent } from '../lib/types';
  import Sheet from './Sheet.svelte';

  let { e, onclose }: { e: PartyEvent; onclose: () => void } = $props();

  let tab = $state<'message' | 'card' | 'send'>('message');
  let canvas = $state<HTMLCanvasElement>();
  const text = $derived(inviteText(e, app.d.settings));
  const custom = $derived(!!e.inviteText?.trim());
  const notSent = $derived(e.guests.filter((g) => g.status === 'list'));
  const changed = () => touch(e);

  // Redraw the card whenever the details or the look change.
  $effect(() => {
    if (tab !== 'card' || !canvas) return;
    void JSON.stringify([e.cardStyle, e.title, e.emoji, e.date, e.start, e.end, e.place, e.theme, e.inviteNote, e.rsvpBy, app.d.settings]);
    drawCard(canvas, $state.snapshot(e) as PartyEvent, app.d.settings);
  });

  function editText(ev: Event & { currentTarget: HTMLTextAreaElement }) {
    const v = ev.currentTarget.value;
    e.inviteText = v.trim() && v !== generatedInvite(e, app.d.settings) ? v : undefined;
    changed();
  }

  async function copy() {
    if (await copyText(text)) toast('Invitation copied 📋 Paste it in a text or group chat');
  }

  async function shareText() {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // Cancelled.
      }
    } else copy();
  }

  async function shareCard() {
    if (!canvas) return;
    await shareFile(await canvasFile(canvas, cardFileName(e)), displayTitle(e));
  }

  async function saveCard() {
    if (canvas) download(await canvasFile(canvas, cardFileName(e)));
  }

  function markAll() {
    const list = [...notSent];
    for (const g of list) setStatus(g, 'invited');
    changed();
    toast(`Marked ${list.length} as invited ✉️`, {
      label: 'Undo',
      run: () => {
        for (const g of list) setStatus(g, 'list');
        changed();
      },
    });
  }

  function sendTo(g: Guest) {
    const url = sendUrl(g.contact ?? '', `You're invited: ${displayTitle(e)}`, personalInvite(e, app.d.settings, g));
    if (url) location.href = url;
    setStatus(g, 'invited');
    changed();
  }
</script>

<Sheet {onclose} label="Invitation" full>
  <div class="stack">
    <h2>💌 Invitation</h2>
    <div class="seg fill">
      <button class:on={tab === 'message'} onclick={() => (tab = 'message')}>💬 Words</button>
      <button class:on={tab === 'card'} onclick={() => (tab = 'card')}>🖼️ Card</button>
      <button class:on={tab === 'send'} onclick={() => (tab = 'send')}>✉️ Send{notSent.length ? ` (${notSent.length})` : ''}</button>
    </div>

    {#if tab === 'message'}
      <textarea class="input invite-text" rows="9" value={text} oninput={editText} aria-label="Invitation message"></textarea>
      {#if custom}
        <button class="link-btn" onclick={() => ((e.inviteText = undefined), changed())}>↺ Go back to the automatic wording</button>
      {:else}
        <label class="field">
          <span>Add a line</span>
          <input class="input" bind:value={e.inviteNote} oninput={changed} placeholder="Swimsuits welcome! No gifts please." />
        </label>
        <p class="muted small" style="margin:0">Written from the event details, so it stays up to date. Edit the message above to word it yourself.</p>
      {/if}
      {#if !app.d.settings.name && !app.d.settings.phone}
        <p class="small warn-text" style="margin:0">Tip: add your name and phone in Settings so the RSVP line says who to reply to.</p>
      {/if}
      <div class="row">
        <button class="btn primary" onclick={shareText}>Share…</button>
        <button class="btn" onclick={copy}>📋 Copy</button>
      </div>
    {:else if tab === 'card'}
      <div class="seg fill">
        {#each CARD_STYLES as c (c.id)}
          <button class:on={e.cardStyle === c.id} onclick={() => ((e.cardStyle = c.id), changed())}>{c.label}</button>
        {/each}
      </div>
      <canvas bind:this={canvas} class="card-preview" width="1080" height="1350" aria-label="Invitation card preview"></canvas>
      <div class="row">
        <button class="btn primary" onclick={shareCard}>Share picture…</button>
        <button class="btn" onclick={saveCard}>⬇️ Save picture</button>
      </div>
      <p class="muted small" style="margin:0">Send it in a text or group chat, or print it. It uses the same details as the message.</p>
    {:else}
      {#if notSent.length}
        <p class="muted small" style="margin:0">
          Text or email each household (the app opens Messages or Mail with the invitation filled in), or send it your own way and mark them invited.
        </p>
        <div class="rows tight">
          {#each notSent as g (g.id)}
            {@const k = contactKind(g.contact)}
            <div class="send-row">
              <span class="send-name"><strong>{g.name}</strong>{#if g.contact}<span class="muted small">{g.contact}</span>{/if}</span>
              {#if k}
                <button class="btn small primary" onclick={() => sendTo(g)}>{k === 'phone' ? '💬 Text' : '📧 Email'}</button>
              {/if}
              <button class="btn small" onclick={() => (setStatus(g, 'invited'), changed())}>✓ Sent</button>
            </div>
          {/each}
        </div>
        <button class="btn block" onclick={markAll}>✉️ Mark all {notSent.length} as invited</button>
      {:else}
        <div class="empty" style="padding:24px 8px">
          <span class="big-emoji">📬</span>
          <p class="muted">{e.guests.length ? 'Everyone on the list has been invited.' : 'Add guests first, then send from here.'}</p>
        </div>
      {/if}
    {/if}
  </div>
</Sheet>
