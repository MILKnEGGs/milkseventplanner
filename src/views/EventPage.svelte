<script lang="ts">
  import DetailsSheet from '../components/DetailsSheet.svelte';
  import Icon from '../components/Icon.svelte';
  import InviteSheet from '../components/InviteSheet.svelte';
  import Sheet from '../components/Sheet.svelte';
  import TopBar from '../components/TopBar.svelte';
  import { displayTitle, duplicateEvent, fmtShort, icsFor } from '../lib/data';
  import { shareFile } from '../lib/files';
  import { app, eventById, go, router, save, toast, touch, ui, type Section } from '../lib/store.svelte';
  import Budget from './event/Budget.svelte';
  import DayOf from './event/DayOf.svelte';
  import Food from './event/Food.svelte';
  import Guests from './event/Guests.svelte';
  import Overview from './event/Overview.svelte';
  import Todo from './event/Todo.svelte';

  let { id }: { id: string } = $props();

  const e = $derived(eventById(id));
  const section = $derived(router.route.section ?? 'overview');
  let menu = $state(false);
  // Opened straight after "Plan another like this" so the new date gets picked.
  let editing = $state(ui.editNext === id);
  ui.editNext = '';
  let inviting = $state(false);

  const SECTIONS: { id: Section; label: string }[] = [
    { id: 'overview', label: '🎈 Overview' },
    { id: 'guests', label: '👥 Guests' },
    { id: 'todo', label: '☑️ To-do' },
    { id: 'food', label: '🍕 Food' },
    { id: 'budget', label: '💵 Budget' },
    { id: 'day', label: '🎉 Day of' },
  ];

  const counts = $derived(
    e
      ? {
          guests: e.guests.length,
          todo: e.tasks.filter((t) => !t.done).length,
          food: e.food.length,
          budget: e.expenses.length,
          day: e.schedule.length,
        }
      : {},
  );

  // Keep the chosen section tab in view on narrow screens.
  let tabsEl = $state<HTMLElement>();
  $effect(() => {
    void section;
    tabsEl?.querySelector<HTMLElement>('a.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  });

  async function calendar() {
    menu = false;
    if (!e) return;
    const ics = icsFor($state.snapshot(e) as typeof e);
    if (!ics) return toast('Pick a date first 📅');
    await shareFile(new File([ics], `${displayTitle(e).replace(/[^\w -]+/g, '').trim() || 'event'}.ics`, { type: 'text/calendar' }), displayTitle(e));
  }

  function duplicate() {
    menu = false;
    if (!e) return;
    const c = duplicateEvent($state.snapshot(e) as typeof e);
    app.d.events.push(c);
    save();
    ui.editNext = c.id;
    toast('Copied with the same guests, to-dos and menu. Pick a new date! 📅');
    go(`e/${c.id}`);
  }

  function remove() {
    menu = false;
    if (!e || !confirm(`Delete “${displayTitle(e)}”${e.date ? ` (${fmtShort(e.date)})` : ''} and everything in it?`)) return;
    const i = app.d.events.indexOf(e);
    const gone = e;
    app.d.events.splice(i, 1);
    save();
    go('', true);
    toast('Event deleted', {
      label: 'Undo',
      run: () => {
        app.d.events.splice(i, 0, gone);
        touch(gone);
      },
    });
  }
</script>

{#if !e}
  <TopBar title="Not found" showBack />
  <main class="page">
    <div class="empty">
      <span class="big-emoji">🤷</span>
      <p class="muted">This event isn't on this device.</p>
      <a class="btn primary" href="#/">Back to events</a>
    </div>
  </main>
{:else}
  <TopBar title={displayTitle(e)} sub={e.date ? fmtShort(e.date) : undefined} showBack ontitle={() => (editing = true)}>
    <button class="icon-btn" aria-label="Invitation" onclick={() => (inviting = true)}>💌</button>
    <button class="icon-btn" aria-label="More" onclick={() => (menu = true)}><Icon name="more" /></button>
  </TopBar>

  <nav class="sections" aria-label="Sections">
    <div class="sections-inner" bind:this={tabsEl}>
      {#each SECTIONS as s (s.id)}
        <a
          href="#/e/{e.id}/{s.id}"
          class:on={section === s.id}
          aria-current={section === s.id ? 'page' : undefined}
          onclick={(ev) => {
            ev.preventDefault();
            go(`e/${e.id}/${s.id}`, true);
          }}
        >
          {s.label}
          {#if counts[s.id as keyof typeof counts]}<span class="count">{counts[s.id as keyof typeof counts]}</span>{/if}
        </a>
      {/each}
    </div>
  </nav>

  <main class="page stack">
    {#if section === 'guests'}
      <Guests {e} oninvite={() => (inviting = true)} />
    {:else if section === 'todo'}
      <Todo {e} />
    {:else if section === 'food'}
      <Food {e} />
    {:else if section === 'budget'}
      <Budget {e} />
    {:else if section === 'day'}
      <DayOf {e} />
    {:else}
      <Overview {e} onedit={() => (editing = true)} oninvite={() => (inviting = true)} oncalendar={calendar} />
    {/if}
  </main>

  {#if menu}
    <Sheet onclose={() => (menu = false)} label="Event menu">
      <div class="menu">
        <button onclick={() => ((menu = false), (editing = true))}><span class="ico">✏️</span>Edit details</button>
        <button onclick={() => ((menu = false), (inviting = true))}><span class="ico">💌</span>Invitation</button>
        <button onclick={calendar}><span class="ico">📅</span>Add to my calendar</button>
        <button onclick={duplicate}><span class="ico">🔁</span>Plan another like this</button>
        <button class="danger" onclick={remove}><span class="ico">🗑️</span>Delete event</button>
      </div>
    </Sheet>
  {/if}
  {#if editing}<DetailsSheet event={e} onclose={() => (editing = false)} />{/if}
  {#if inviting}<InviteSheet {e} onclose={() => (inviting = false)} />{/if}
{/if}
