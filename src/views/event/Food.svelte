<script lang="ts">
  import Icon from '../../components/Icon.svelte';
  import { dietNeeds, newFood, people, headcount } from '../../lib/data';
  import { toast, touch } from '../../lib/store.svelte';
  import type { Food, PartyEvent } from '../../lib/types';

  let { e }: { e: PartyEvent } = $props();

  let menuText = $state('');
  let bringText = $state('');
  let bringWho = $state('');
  const changed = () => touch(e);

  const diets = $derived(dietNeeds(e));
  const menu = $derived(e.food.filter((f) => f.kind === 'menu'));
  const bring = $derived(e.food.filter((f) => f.kind === 'bring'));
  const possible = $derived(e.guests.filter((g) => g.status !== 'no').sort((a, b) => a.name.localeCompare(b.name)));
  const h = $derived(headcount(e));
  const nameOf = (id?: string) => e.guests.find((g) => g.id === id)?.name;

  function addMenu(ev: SubmitEvent) {
    ev.preventDefault();
    if (!menuText.trim()) return;
    e.food.push(newFood(menuText.trim(), 'menu'));
    menuText = '';
    changed();
  }

  function addBring(ev: SubmitEvent) {
    ev.preventDefault();
    if (!bringText.trim()) return;
    e.food.push(newFood(bringText.trim(), 'bring', bringWho || undefined));
    bringText = '';
    changed();
  }

  function remove(f: Food) {
    const i = e.food.indexOf(f);
    e.food.splice(i, 1);
    changed();
    toast(`Removed ${f.name}`, { label: 'Undo', run: () => (e.food.splice(i, 0, f), changed()) });
  }
</script>

<section class="card stack tight">
  <h3>🥜 Allergies & dietary needs</h3>
  {#if diets.length}
    <ul class="diet-list">
      {#each diets as d (d.name)}<li><strong>{d.name}</strong>: {d.diet}</li>{/each}
    </ul>
  {:else}
    <p class="muted small" style="margin:0">None noted. Add them on each guest.</p>
  {/if}
  {#if h.yes.households || h.maybe.households}
    <p class="small" style="margin:0">Feeding about <strong>{people(h.yes)}</strong>{h.maybe.households ? ` (up to ${people(h.yes) + people(h.maybe)} with maybes)` : ''}.</p>
  {/if}
</section>

<section class="stack tight">
  <h3 class="group-head">🍕 Menu <span class="muted small">(you're making or buying)</span></h3>
  <div class="card flush">
    {#each menu as f (f.id)}{@render foodRow(f)}{/each}
    <form class="row add-row inside" onsubmit={addMenu}>
      <input class="input" bind:value={menuText} placeholder="Pizza, cake, juice boxes…" aria-label="Add to the menu" />
      <button class="btn primary" disabled={!menuText.trim()} aria-label="Add"><Icon name="plus" /></button>
    </form>
  </div>
</section>

<section class="stack tight">
  <h3 class="group-head">🧺 Guests are bringing</h3>
  <div class="card flush">
    {#each bring as f (f.id)}{@render foodRow(f)}{/each}
    <form class="stack tight add-row inside" onsubmit={addBring}>
      <input class="input" bind:value={bringText} placeholder="Chips, a salad, ice…" aria-label="Something a guest is bringing" />
      <div class="row" style="flex-wrap:nowrap">
        <select class="input" bind:value={bringWho} aria-label="Who's bringing it">
          <option value="">Who? (pick later)</option>
          {#each possible as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
        </select>
        <button class="btn primary" disabled={!bringText.trim()} aria-label="Add"><Icon name="plus" /></button>
      </div>
    </form>
  </div>
</section>

{#snippet foodRow(f: Food)}
  <div class="trow" class:done={f.done}>
    <button class="check" role="checkbox" aria-checked={f.done} aria-label="{f.kind === 'menu' ? 'Got' : 'Arrived'}: {f.name}" onclick={() => ((f.done = !f.done), changed())}>
      {#if f.done}<Icon name="check" size={18} stroke={3} />{/if}
    </button>
    <span class="trow-text">
      <input class="bare" bind:value={f.name} oninput={changed} aria-label="Item" />
      {#if f.kind === 'bring'}
        <select class="mini-select" bind:value={f.guestId} onchange={changed} aria-label="Who's bringing {f.name}">
          <option value={undefined}>🙋 Who's bringing it?</option>
          {#each possible as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
          {#if f.guestId && !possible.some((g) => g.id === f.guestId)}<option value={f.guestId}>{nameOf(f.guestId) ?? '?'} (can't come)</option>{/if}
        </select>
      {/if}
    </span>
    <input class="input slim qty" bind:value={f.qty} oninput={changed} placeholder="Qty" aria-label="Amount of {f.name}" />
    <button class="remove-btn" aria-label="Remove {f.name}" onclick={() => remove(f)}><Icon name="x" size={18} /></button>
  </div>
{/snippet}
