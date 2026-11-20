<script lang="ts">
  import TopBar from '../components/TopBar.svelte';
  import { allTasks, daysBetween, displayTitle, fmtShort } from '../lib/data';
  import { app, today, toast, touch } from '../lib/store.svelte';
  import type { PartyEvent, Task } from '../lib/types';

  // Every open to-do across upcoming events in one list, soonest first.
  const items = $derived(allTasks(app.d, today.s));
  const late = $derived(items.filter((x) => x.due && x.due < today.s));
  const week = $derived(items.filter((x) => x.due && x.due >= today.s && daysBetween(today.s, x.due) <= 7));
  const later = $derived(items.filter((x) => !x.due || daysBetween(today.s, x.due) > 7));

  function done(e: PartyEvent, t: Task) {
    t.done = true;
    touch(e);
    toast(`✓ ${t.text}`, { label: 'Undo', run: () => ((t.done = false), touch(e)) }, 3500);
  }
</script>

<TopBar title="To-do" sub={items.length ? `${items.length} open across your events` : undefined} />

<main class="page stack">
  {#if !items.length}
    <div class="empty">
      <span class="big-emoji">🥳</span>
      <h3>All caught up</h3>
      <p class="muted">To-dos from every upcoming event show up here, soonest first.</p>
    </div>
  {/if}
  {#each [{ k: 'late', label: '⏰ Overdue', list: late }, { k: 'week', label: 'This week', list: week }, { k: 'later', label: 'Later', list: later }] as g (g.k)}
    {#if g.list.length}
      <section class="stack tight">
        <h3 class="group-head" class:warn-text={g.k === 'late'}>{g.label}</h3>
        <div class="card flush">
          {#each g.list as x (x.t.id)}
            <div class="trow">
              <button class="check" role="checkbox" aria-checked="false" aria-label="Done: {x.t.text}" onclick={() => done(x.e, x.t)}></button>
              <a class="trow-text plain-link" href="#/e/{x.e.id}/todo">
                <span>{x.t.text}</span>
                <span class="small muted">{x.e.emoji} {displayTitle(x.e)}{x.due ? ` · ${fmtShort(x.due)}` : ''}</span>
              </a>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/each}
</main>
