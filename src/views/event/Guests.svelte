<script lang="ts">
  import AddGuestsSheet from '../../components/AddGuestsSheet.svelte';
  import GuestSheet from '../../components/GuestSheet.svelte';
  import RsvpBar from '../../components/RsvpBar.svelte';
  import StatusPill from '../../components/StatusPill.svelte';
  import { countText, headcount, partyOf, people, setStatus, STATUSES } from '../../lib/data';
  import { toast, touch } from '../../lib/store.svelte';
  import type { Guest, PartyEvent, Rsvp } from '../../lib/types';

  let { e, oninvite }: { e: PartyEvent; oninvite: () => void } = $props();

  let filter = $state<Rsvp | ''>('');
  let open = $state<Guest>();
  let adding = $state(false);

  const h = $derived(headcount(e));
  const ORDER: Record<Rsvp, number> = { invited: 0, maybe: 1, yes: 2, list: 3, no: 4 };
  const shown = $derived(
    e.guests.filter((g) => !filter || g.status === filter).sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name)),
  );

  function answer(g: Guest, s: Rsvp) {
    const was = g.status;
    setStatus(g, s);
    touch(e);
    toast(`${g.name}: ${STATUSES.find((x) => x.id === s)!.label}`, { label: 'Undo', run: () => (setStatus(g, was), touch(e)) }, 3500);
  }
</script>

{#if e.guests.length}
  <section class="card stack tight">
    <div class="headcount">
      <div>
        <strong class="big-num">{people(h.yes)}</strong>
        <span class="muted small">coming{h.yes.households ? ` · ${countText(h.yes)}` : ''}</span>
      </div>
      {#if h.maybe.households}
        <div>
          <strong class="big-num maybe">+{people(h.maybe)}</strong>
          <span class="muted small">maybe</span>
        </div>
      {/if}
    </div>
    <RsvpBar guests={e.guests} />
    <p class="muted small" style="margin:0">
      {h.all.households} households · {people(h.all)} people invited or on the list ({countText(h.all)})
    </p>
  </section>

  <div class="chips scroll">
    <button class="chip small-chip" class:on={!filter} onclick={() => (filter = '')}>All <span class="count">{e.guests.length}</span></button>
    {#each STATUSES as s (s.id)}
      {@const c = h[s.id].households}
      {#if c}
        <button class="chip small-chip" class:on={filter === s.id} onclick={() => (filter = filter === s.id ? '' : s.id)}>
          {s.emoji} {s.short} <span class="count">{c}</span>
        </button>
      {/if}
    {/each}
  </div>

  {#if h.list.households}
    <button class="banner banner-btn" onclick={oninvite}>
      <span>📝 {h.list.households} not invited yet</span><span class="spacer"></span><strong>Send invitations ›</strong>
    </button>
  {/if}

  <div class="card flush">
    {#each shown as g (g.id)}
      {@const p = partyOf(g)}
      <div class="grow">
        <button class="grow-main" onclick={() => (open = g)}>
          <span class="grow-text">
            <strong>{g.name}</strong>
            <span class="muted small">
              {countText(p)}{g.status === 'yes' && (g.comingAdults !== undefined || g.comingKids !== undefined) ? ` (of ${countText(g)})` : ''}
              {#if g.diet}· 🥜 {g.diet}{/if}
            </span>
          </span>
          <StatusPill status={g.status} small />
        </button>
        {#if g.status === 'invited'}
          <div class="quick" role="group" aria-label="Answer for {g.name}">
            <button style="--c: var(--st-yes)" onclick={() => answer(g, 'yes')}>🎉 Coming</button>
            <button style="--c: var(--st-maybe)" onclick={() => answer(g, 'maybe')}>🤔 Maybe</button>
            <button style="--c: var(--st-no)" onclick={() => answer(g, 'no')}>😢 Can't</button>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{:else}
  <div class="empty">
    <span class="big-emoji">👥</span>
    <h3>Who's invited?</h3>
    <p class="muted">Type or paste your list, one household per line. Track who's coming, adults and kids.</p>
  </div>
{/if}

<button class="fab" onclick={() => (adding = true)}>+ Add guests</button>

{#if adding}<AddGuestsSheet {e} onclose={() => (adding = false)} />{/if}
{#if open}<GuestSheet {e} guest={open} onclose={() => (open = undefined)} />{/if}
