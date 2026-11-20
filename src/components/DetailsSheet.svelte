<script lang="ts">
  import { EMOJIS, KINDS, kindOf, newEvent, savedPlaces, suggestTitle } from '../lib/data';
  import { app, go, touch } from '../lib/store.svelte';
  import type { Kind, PartyEvent } from '../lib/types';
  import Sheet from './Sheet.svelte';

  // New event (no `event`) or editing an existing one's details. Works on a copy; Save writes it back.
  let { event, onclose }: { event?: PartyEvent; onclose: () => void } = $props();

  const isNew = !event;
  const d = $state<PartyEvent>(event ? $state.snapshot(event) : newEvent('birthday'));
  let pickedEmoji = !isNew;
  let showEmojis = $state(false);
  const places = savedPlaces(app.d, d.id);
  const suggested = $derived(suggestTitle(d.kind, d.honoree, d.age));
  const placeMatches = $derived(
    places.filter((p) => p.name.toLowerCase() !== d.place.name.trim().toLowerCase() && (!d.place.name.trim() || p.name.toLowerCase().includes(d.place.name.trim().toLowerCase()))).slice(0, 6),
  );

  function pickKind(k: Kind) {
    d.kind = k;
    if (!pickedEmoji) d.emoji = kindOf(k).emoji;
  }

  function submit(ev: SubmitEvent) {
    ev.preventDefault();
    d.title = d.title.trim();
    d.age = d.age ? Math.round(d.age) : undefined;
    for (const k of ['date', 'start', 'end', 'rsvpBy'] as const) if (!d[k]) d[k] = undefined;
    if (event) {
      Object.assign(event, d);
      touch(event);
      onclose();
    } else {
      const e = d;
      app.d.events.push(e);
      touch(app.d.events[app.d.events.length - 1]);
      onclose();
      go(`e/${e.id}`);
    }
  }
</script>

<Sheet {onclose} label={isNew ? 'New event' : 'Event details'} full>
  <form class="stack" onsubmit={submit}>
    <h2>{isNew ? '🎉 New event' : 'Event details'}</h2>

    <div class="field">
      <span>What kind?</span>
      <div class="chips">
        {#each KINDS as k (k.id)}
          <button type="button" class="chip small-chip" class:on={d.kind === k.id} onclick={() => pickKind(k.id)}>{k.emoji} {k.label}</button>
        {/each}
      </div>
    </div>

    <div class="grid2">
      <label class="field">
        <span>{d.kind === 'birthday' ? 'Birthday of' : d.kind === 'wedding' ? 'Couple' : 'Who is it for?'}</span>
        <input class="input" bind:value={d.honoree} placeholder={d.kind === 'birthday' ? 'Ava' : 'Optional'} autocomplete="off" />
      </label>
      {#if d.kind === 'birthday' || d.kind === 'wedding'}
        <label class="field">
          <span>{d.kind === 'birthday' ? 'Turning' : 'Years'}</span>
          <input class="input" type="number" inputmode="numeric" min="0" max="150" bind:value={d.age} placeholder="7" />
        </label>
      {/if}
    </div>

    <div class="field">
      <span>Name</span>
      <div class="row" style="flex-wrap:nowrap">
        <button type="button" class="emoji-btn" aria-label="Pick an emoji" onclick={() => (showEmojis = !showEmojis)}>{d.emoji}</button>
        <input class="input" bind:value={d.title} placeholder={suggested || 'Summer cookout'} aria-label="Event name" />
      </div>
      {#if showEmojis}
        <div class="emoji-grid">
          {#each EMOJIS as em (em)}
            <button type="button" class:on={d.emoji === em} onclick={() => ((d.emoji = em), (pickedEmoji = true), (showEmojis = false))}>{em}</button>
          {/each}
        </div>
      {/if}
      {#if suggested && !d.title}<span class="muted small">Leave it blank to use “{suggested}”.</span>{/if}
    </div>

    <div class="grid2">
      <label class="field"><span>📅 Date</span><input class="input" type="date" bind:value={d.date} /></label>
      <label class="field"><span>✉️ RSVP by</span><input class="input" type="date" bind:value={d.rsvpBy} max={d.date} /></label>
      <label class="field"><span>Starts</span><input class="input" type="time" bind:value={d.start} step="900" /></label>
      <label class="field"><span>Ends</span><input class="input" type="time" bind:value={d.end} step="900" /></label>
    </div>

    <div class="field">
      <span>📍 Where</span>
      <input class="input" bind:value={d.place.name} placeholder="Our house, Jump Zone, the park…" aria-label="Place name" autocomplete="off" />
      {#if placeMatches.length}
        <div class="chips">
          {#each placeMatches as p (p.name)}
            <button type="button" class="chip small-chip" onclick={() => (d.place = { ...p })}>↺ {p.name}</button>
          {/each}
        </div>
      {/if}
      <input class="input" bind:value={d.place.address} placeholder="Address (for the map link)" aria-label="Address" autocomplete="off" />
      <input class="input" bind:value={d.place.notes} placeholder="Parking, which door, what to bring…" aria-label="Directions and notes" />
    </div>

    <label class="field">
      <span>🎨 Theme</span>
      <input class="input" bind:value={d.theme} placeholder="Dinosaurs, pool party, ugly sweaters…" />
    </label>

    <label class="field">
      <span>Notes</span>
      <textarea class="input" bind:value={d.notes} rows="3" placeholder="Anything to remember"></textarea>
    </label>

    <div class="row sheet-actions">
      <button type="button" class="btn ghost" onclick={onclose}>Cancel</button>
      <span class="spacer"></span>
      <button class="btn primary">{isNew ? 'Start planning 🎉' : 'Save'}</button>
    </div>
  </form>
</Sheet>
