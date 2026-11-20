<script lang="ts">
  import type { Guest, Rsvp } from '../lib/types';

  // One slice per household, coloured by answer: coming, maybe, waiting, can't, not invited yet.
  let { guests }: { guests: Guest[] } = $props();
  const ORDER: Rsvp[] = ['yes', 'maybe', 'invited', 'no', 'list'];
  const parts = $derived(ORDER.map((s) => ({ s, n: guests.filter((g) => g.status === s).length })).filter((p) => p.n));
</script>

{#if guests.length}
  <div class="rsvpbar" aria-hidden="true">
    {#each parts as p (p.s)}<span style="flex:{p.n}; background: var(--st-{p.s})"></span>{/each}
  </div>
{/if}
