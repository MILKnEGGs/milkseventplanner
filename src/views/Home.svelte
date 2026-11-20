<script lang="ts">
  import DetailsSheet from '../components/DetailsSheet.svelte';
  import EventCard from '../components/EventCard.svelte';
  import TopBar from '../components/TopBar.svelte';
  import { sortEvents } from '../lib/data';
  import { app, today } from '../lib/store.svelte';

  let creating = $state(false);
  let showPast = $state(false);
  const sorted = $derived(sortEvents(app.d.events, today.s));
</script>

<TopBar title="Milk's Event Planner" sub={sorted.upcoming.length ? `${sorted.upcoming.length} coming up` : undefined} />

<main class="page stack">
  {#if !app.d.events.length}
    <div class="empty hello">
      <span class="big-emoji">🎉</span>
      <h2>Let's plan a party!</h2>
      <p class="muted">Birthdays, showers, cookouts, dinners: keep the guest list and RSVPs, invitations, the place, to-dos, food, budget and the big day in one spot.</p>
      <button class="btn primary" onclick={() => (creating = true)}>🎈 Plan an event</button>
      <p class="muted small">Everything stays on this device and works offline.</p>
    </div>
  {:else}
    {#each sorted.upcoming as e (e.id)}<EventCard {e} />{/each}
    {#if !sorted.upcoming.length}
      <div class="empty" style="padding:24px 16px">
        <span class="big-emoji">🗓️</span>
        <p class="muted">Nothing coming up. Time to plan the next one?</p>
      </div>
    {/if}
    {#if sorted.past.length}
      <button class="link-btn" onclick={() => (showPast = !showPast)}>{showPast ? '▾' : '▸'} Past events ({sorted.past.length})</button>
      {#if showPast}
        <div class="stack past">
          {#each sorted.past as e (e.id)}<EventCard {e} />{/each}
        </div>
      {/if}
    {/if}
  {/if}
</main>

{#if app.d.events.length}<button class="fab" onclick={() => (creating = true)}>+ New event</button>{/if}

{#if creating}<DetailsSheet onclose={() => (creating = false)} />{/if}
