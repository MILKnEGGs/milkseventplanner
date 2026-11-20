<script lang="ts">
  import { copyGuest, countText, parseGuestLines, pastGuests } from '../lib/data';
  import { app, toast, touch } from '../lib/store.svelte';
  import type { PartyEvent } from '../lib/types';
  import Sheet from './Sheet.svelte';
  import Stepper from './Stepper.svelte';

  let { e, onclose }: { e: PartyEvent; onclose: () => void } = $props();

  const past = pastGuests(app.d, e.id);
  const here = new Set(e.guests.map((g) => g.name.trim().toLowerCase()));
  const offered = past.filter((p) => !here.has(p.guest.name.trim().toLowerCase()));

  let tab = $state<'type' | 'past'>('type');
  let text = $state('');
  // A kid's party usually invites a child plus a grown-up.
  let defAdults = $state(1);
  let defKids = $state(e.kind === 'birthday' && e.age && e.age < 14 ? 1 : 0);
  let picked = $state<Record<string, boolean>>({});
  let q = $state('');

  const parsed = $derived(parseGuestLines(text, defAdults, defKids));
  const shown = $derived(offered.filter((p) => !q.trim() || p.guest.name.toLowerCase().includes(q.trim().toLowerCase())));
  const pickedCount = $derived(Object.values(picked).filter(Boolean).length);

  function addTyped() {
    if (!parsed.length) return;
    e.guests.push(...parsed);
    touch(e);
    toast(`Added ${parsed.length} ${parsed.length === 1 ? 'household' : 'households'} 🎉`);
    onclose();
  }

  function addPast() {
    const add = offered.filter((p) => picked[p.guest.id]).map((p) => copyGuest(p.guest));
    if (!add.length) return;
    e.guests.push(...add);
    touch(e);
    toast(`Added ${add.length} ${add.length === 1 ? 'household' : 'households'} 🎉`);
    onclose();
  }
</script>

<Sheet {onclose} label="Add guests" full>
  <div class="stack">
    <h2>Add guests</h2>
    {#if offered.length}
      <div class="seg">
        <button class:on={tab === 'type'} onclick={() => (tab = 'type')}>✏️ Type or paste</button>
        <button class:on={tab === 'past'} onclick={() => (tab = 'past')}>↺ From other events ({offered.length})</button>
      </div>
    {/if}

    {#if tab === 'type'}
      <textarea
        class="input"
        rows="6"
        bind:value={text}
        placeholder={'One household per line, for example:\nThe Smiths 2+2\nGrandma\nLiam 555-123-4567'}
        aria-label="Guests, one per line"
      ></textarea>
      <p class="muted small" style="margin:0">
        Add <strong>2+1</strong> after a name for 2 adults and 1 kid. A phone number or email on the line is saved for sending the invitation.
      </p>
      <div class="card soft stack tight">
        <strong class="small">When a line has no numbers, invite</strong>
        <Stepper label="Adults" bind:value={defAdults} />
        <Stepper label="Kids" bind:value={defKids} />
      </div>
      {#if parsed.length}
        <div class="preview-list">
          {#each parsed as g (g.id)}
            <div><strong>{g.name}</strong> <span class="muted small">{countText(g)}{g.contact ? ` · ${g.contact}` : ''}</span></div>
          {/each}
        </div>
      {/if}
      <button class="btn primary block" disabled={!parsed.length} onclick={addTyped}>
        Add {parsed.length || ''} {parsed.length === 1 ? 'household' : 'households'}
      </button>
    {:else}
      <input class="input" bind:value={q} placeholder="Search" aria-label="Search past guests" />
      <div class="pick-list">
        {#each shown as p (p.guest.id)}
          <label class="pick">
            <input type="checkbox" bind:checked={picked[p.guest.id]} />
            <span>
              <strong>{p.guest.name}</strong>
              <span class="muted small">{countText(p.guest)} · {p.from}</span>
            </span>
          </label>
        {:else}
          <p class="muted center">Nobody matches.</p>
        {/each}
      </div>
      <button class="btn primary block" disabled={!pickedCount} onclick={addPast}>
        Add {pickedCount || ''} {pickedCount === 1 ? 'household' : 'households'}
      </button>
    {/if}
  </div>
</Sheet>
