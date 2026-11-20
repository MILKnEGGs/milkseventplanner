<script lang="ts">
  import { countText, daysUntil, displayTitle, fmtDateYear, headcount, overdueRsvps, people, relDays, timeRange } from '../lib/data';
  import { today } from '../lib/store.svelte';
  import type { PartyEvent } from '../lib/types';
  import RsvpBar from './RsvpBar.svelte';

  let { e }: { e: PartyEvent } = $props();
  const h = $derived(headcount(e));
  const n = $derived(daysUntil(e, today.s));
  const open = $derived(e.tasks.filter((t) => !t.done).length);
  const late = $derived(overdueRsvps(e, today.s));
</script>

<a class="card ecard" href="#/e/{e.id}">
  <span class="ebadge" aria-hidden="true">{e.emoji}</span>
  <span class="etext">
    <strong class="ename">{displayTitle(e)}</strong>
    <span class="emeta">
      {#if e.date}
        {fmtDateYear(e.date, today.s)}{e.start ? ` · ${timeRange(e.start, e.end)}` : ''}
      {:else}
        <span class="muted">No date yet</span>
      {/if}
    </span>
    {#if e.place.name.trim()}<span class="emeta muted">📍 {e.place.name}</span>{/if}
    {#if e.guests.length}
      <RsvpBar guests={e.guests} />
      <span class="emeta small">
        <strong>{people(h.yes)} coming</strong>
        {#if h.yes.households}<span class="muted">({countText(h.yes)})</span>{/if}
        {#if h.invited.households}· {h.invited.households} waiting{/if}
        {#if h.maybe.households}· {h.maybe.households} maybe{/if}
      </span>
    {/if}
    {#if open || late}
      <span class="row" style="gap:6px">
        {#if open}<span class="tag">☑️ {open} to do</span>{/if}
        {#if late}<span class="tag warn">⏰ {late} RSVP{late === 1 ? '' : 's'} overdue</span>{/if}
      </span>
    {/if}
  </span>
  {#if n !== undefined}
    <span class="when" class:soon={n >= 0 && n <= 7} class:now={n === 0}>
      {#if n === 0}<strong>Today!</strong>{:else if n > 0 && n < 100}<strong>{n}</strong><span>day{n === 1 ? '' : 's'}</span>{:else}<span>{relDays(n)}</span>{/if}
    </span>
  {/if}
</a>
