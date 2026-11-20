<script lang="ts">
  import Icon from '../../components/Icon.svelte';
  import { daysBetween, fmtShort, newTask, starterTasks, taskDue } from '../../lib/data';
  import { today, toast, touch } from '../../lib/store.svelte';
  import type { PartyEvent, Task } from '../../lib/types';

  let { e }: { e: PartyEvent } = $props();

  let text = $state('');
  let showDone = $state(false);
  const changed = () => touch(e);

  type Group = { key: string; label: string; items: { t: Task; due?: string }[] };
  const groups = $derived.by(() => {
    const g: Record<string, Group> = {
      late: { key: 'late', label: '⏰ Overdue', items: [] },
      week: { key: 'week', label: 'This week', items: [] },
      later: { key: 'later', label: 'Later', items: [] },
      none: { key: 'none', label: 'Whenever', items: [] },
    };
    for (const t of e.tasks) {
      if (t.done) continue;
      const due = taskDue(e, t);
      const k = !due ? 'none' : due < today.s ? 'late' : daysBetween(today.s, due) <= 7 ? 'week' : 'later';
      g[k].items.push({ t, due });
    }
    for (const x of Object.values(g)) x.items.sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''));
    return Object.values(g).filter((x) => x.items.length);
  });
  const done = $derived(e.tasks.filter((t) => t.done));
  const pct = $derived(e.tasks.length ? Math.round((done.length / e.tasks.length) * 100) : 0);

  function add(ev: SubmitEvent) {
    ev.preventDefault();
    const v = text.trim();
    if (!v) return;
    e.tasks.push(newTask(v));
    text = '';
    changed();
  }

  function starter() {
    const tasks = starterTasks(e.kind);
    // Planning late? Steps whose date has already gone by are due today rather than "overdue" from the start.
    const left = e.date ? daysBetween(today.s, e.date) : undefined;
    if (left !== undefined && left >= 0) for (const t of tasks) if (t.before !== undefined && t.before > left) t.before = left;
    e.tasks.push(...tasks);
    changed();
    if (!e.date) toast('Add the party date and these get due dates 📅');
  }

  function toggle(t: Task) {
    t.done = !t.done;
    changed();
    if (t.done && e.tasks.every((x) => x.done)) toast('Everything is done! 🎉');
  }

  function setDue(t: Task, v: string) {
    t.before = v && e.date ? daysBetween(v, e.date) : undefined;
    changed();
  }

  function remove(t: Task) {
    const i = e.tasks.indexOf(t);
    e.tasks.splice(i, 1);
    changed();
    toast(`Removed “${t.text}”`, { label: 'Undo', run: () => (e.tasks.splice(i, 0, t), changed()) });
  }

  const whenText = (b?: number) =>
    b === undefined ? '' : b === 0 ? 'on the day' : b > 0 ? `${b} day${b === 1 ? '' : 's'} before` : `${-b} day${b === -1 ? '' : 's'} after`;
</script>

{#if e.tasks.length}
  <section class="card stack tight">
    <div class="sec-head"><strong>{done.length} of {e.tasks.length} done</strong><span class="muted small">{pct}%</span></div>
    <div class="progress"><span style="width:{pct}%"></span></div>
  </section>
{/if}

<form class="row add-row" onsubmit={add}>
  <input class="input" bind:value={text} placeholder="Add a to-do" aria-label="New to-do" />
  <button class="btn primary" disabled={!text.trim()} aria-label="Add"><Icon name="plus" /></button>
</form>

{#each groups as g (g.key)}
  <section class="stack tight">
    <h3 class="group-head" class:warn-text={g.key === 'late'}>{g.label}</h3>
    <div class="card flush">
      {#each g.items as x (x.t.id)}
        {@render taskRow(x.t, x.due)}
      {/each}
    </div>
  </section>
{/each}

{#if !e.tasks.length}
  <div class="empty">
    <span class="big-emoji">☑️</span>
    <h3>Nothing on the list yet</h3>
    <p class="muted">Start with a checklist made for a {e.kind === 'birthday' ? 'birthday party' : 'party like this'}. Due dates count back from the party date.</p>
    <button class="btn primary" onclick={starter}>✨ Add a starter checklist</button>
  </div>
{/if}

{#if done.length}
  <button class="link-btn" onclick={() => (showDone = !showDone)}>{showDone ? 'Hide' : 'Show'} {done.length} done</button>
  {#if showDone}
    <div class="card flush">
      {#each done as t (t.id)}{@render taskRow(t, taskDue(e, t))}{/each}
    </div>
  {/if}
{/if}

{#snippet taskRow(t: Task, due?: string)}
  <div class="trow" class:done={t.done}>
    <button class="check" role="checkbox" aria-checked={t.done} aria-label="Done: {t.text}" onclick={() => toggle(t)}>
      {#if t.done}<Icon name="check" size={18} stroke={3} />{/if}
    </button>
    <span class="trow-text">
      <input class="bare" bind:value={t.text} oninput={changed} aria-label="To-do" />
      <label class="due" class:late={!!due && due < today.s && !t.done}>
        <span>{due ? `${fmtShort(due)} · ${whenText(t.before)}` : e.date ? '+ due date' : ''}</span>
        {#if e.date}
          <input type="date" value={due ?? ''} onchange={(ev) => setDue(t, ev.currentTarget.value)} aria-label="Due date for {t.text}" />
        {/if}
      </label>
    </span>
    <button class="remove-btn" aria-label="Remove {t.text}" onclick={() => remove(t)}><Icon name="x" size={18} /></button>
  </div>
{/snippet}
