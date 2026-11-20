<script lang="ts">
  import Icon from '../../components/Icon.svelte';
  import { countText, fmtTime, isPast, partyOf, sampleSchedule, setStatus, sortSchedule, uid } from '../../lib/data';
  import { today, toast, touch } from '../../lib/store.svelte';
  import type { Guest, PartyEvent, Slot } from '../../lib/types';

  let { e }: { e: PartyEvent } = $props();

  let time = $state('');
  let text = $state('');
  const changed = () => touch(e);
  const slots = $derived(sortSchedule(e.schedule));
  const expected = $derived(e.guests.filter((g) => g.status === 'yes' || g.status === 'maybe').sort((a, b) => a.name.localeCompare(b.name)));
  const here = $derived(expected.filter((g) => g.arrived));
  const herePeople = $derived(here.reduce((n, g) => n + partyOf(g).adults + partyOf(g).kids, 0));
  const expectedPeople = $derived(expected.reduce((n, g) => n + partyOf(g).adults + partyOf(g).kids, 0));
  const came = $derived(e.guests.filter((g) => g.arrived || g.status === 'yes'));
  const thanked = $derived(came.filter((g) => g.thanked).length);
  const after = $derived(isPast(e, today.s) || e.date === today.s);

  function add(ev: SubmitEvent) {
    ev.preventDefault();
    if (!text.trim()) return;
    e.schedule.push({ id: uid(8), time: time || e.start || '12:00', text: text.trim() });
    text = '';
    changed();
  }

  function remove(s: Slot) {
    const i = e.schedule.indexOf(s);
    e.schedule.splice(i, 1);
    changed();
    toast(`Removed ${s.text}`, { label: 'Undo', run: () => (e.schedule.splice(i, 0, s), changed()) });
  }

  function arrive(g: Guest) {
    // Turning up counts as a yes.
    if (!g.arrived && g.status === 'maybe') setStatus(g, 'yes');
    g.arrived = !g.arrived;
    changed();
  }

  function sample() {
    e.schedule.push(...sampleSchedule(e));
    changed();
  }
</script>

<section class="stack tight">
  <h3 class="group-head">🕒 Schedule</h3>
  <div class="card flush">
    {#each slots as s (s.id)}
      <div class="trow">
        <input class="input slim time" type="time" bind:value={s.time} onchange={changed} aria-label="Time" />
        <span class="trow-text"><input class="bare" bind:value={s.text} oninput={changed} aria-label="What happens" /></span>
        <button class="remove-btn" aria-label="Remove {s.text}" onclick={() => remove(s)}><Icon name="x" size={18} /></button>
      </div>
    {/each}
    <form class="row add-row inside" style="flex-wrap:nowrap" onsubmit={add}>
      <input class="input slim time" type="time" bind:value={time} aria-label="Time" />
      <input class="input" bind:value={text} placeholder="Cake and singing" aria-label="What happens" />
      <button class="btn primary" disabled={!text.trim()} aria-label="Add"><Icon name="plus" /></button>
    </form>
  </div>
  {#if !e.schedule.length}
    <button class="btn" onclick={sample}>✨ Start from a sample schedule{e.start ? ` (from ${fmtTime(e.start)})` : ''}</button>
  {/if}
</section>

<section class="stack tight">
  <div class="sec-head">
    <h3 class="group-head">🚪 Check-in</h3>
    {#if expected.length}<span class="small"><strong>{here.length}</strong>/{expected.length} here · {herePeople} of {expectedPeople} people</span>{/if}
  </div>
  {#if expected.length}
    <div class="checkin">
      {#each expected as g (g.id)}
        <button class="checkin-btn" class:on={g.arrived} aria-pressed={!!g.arrived} onclick={() => arrive(g)}>
          <span class="ck">{g.arrived ? '✅' : '⬜'}</span>
          <span class="grow-text">
            <strong>{g.name}</strong>
            <span class="muted small">{countText(partyOf(g))}{g.status === 'maybe' ? ' · maybe' : ''}{g.diet ? ` · 🥜 ${g.diet}` : ''}</span>
          </span>
        </button>
      {/each}
    </div>
  {:else}
    <p class="muted small none">Guests who said yes or maybe show up here on the day, to tick off as they arrive.</p>
  {/if}
</section>

{#if came.length}
  <section class="stack tight">
    <div class="sec-head">
      <h3 class="group-head">💝 Gifts & thank-yous</h3>
      <span class="small"><strong>{thanked}</strong>/{came.length} thanked</span>
    </div>
    {#if !after}<p class="muted small none">For after the party: note who gave what, then tick off thank-yous.</p>{/if}
    <div class="card flush">
      {#each came as g (g.id)}
        <div class="trow" class:done={g.thanked}>
          <button class="check" role="checkbox" aria-checked={!!g.thanked} aria-label="Thanked {g.name}" onclick={() => ((g.thanked = !g.thanked), changed())}>
            {#if g.thanked}<Icon name="check" size={18} stroke={3} />{/if}
          </button>
          <span class="trow-text">
            <strong>{g.name}</strong>
            <input class="bare small" bind:value={g.gift} oninput={changed} placeholder="What did they give?" aria-label="Gift from {g.name}" />
          </span>
        </div>
      {/each}
    </div>
  </section>
{/if}
