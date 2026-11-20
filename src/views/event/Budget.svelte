<script lang="ts">
  import Icon from '../../components/Icon.svelte';
  import { budgetTotals, EXPENSE_IDEAS, fmtMoney, headcount, newExpense, people } from '../../lib/data';
  import { app, toast, touch } from '../../lib/store.svelte';
  import type { Expense, PartyEvent } from '../../lib/types';

  let { e }: { e: PartyEvent } = $props();

  let name = $state('');
  let amount = $state<number>();
  const changed = () => touch(e);
  const cur = $derived(app.d.settings.currency);
  const t = $derived(budgetTotals(e));
  const heads = $derived(people(headcount(e).yes));
  const ideas = $derived(EXPENSE_IDEAS.filter((i) => !e.expenses.some((x) => x.name.toLowerCase() === i.toLowerCase())));
  const pct = $derived(e.budget ? Math.min(100, Math.round((t.planned / e.budget) * 100)) : 0);

  function add(ev?: SubmitEvent) {
    ev?.preventDefault();
    if (!name.trim()) return;
    e.expenses.push(newExpense(name.trim(), amount || undefined));
    name = '';
    amount = undefined;
    changed();
  }

  function remove(x: Expense) {
    const i = e.expenses.indexOf(x);
    e.expenses.splice(i, 1);
    changed();
    toast(`Removed ${x.name}`, { label: 'Undo', run: () => (e.expenses.splice(i, 0, x), changed()) });
  }

  function setBudget(ev: Event & { currentTarget: HTMLInputElement }) {
    const v = parseFloat(ev.currentTarget.value);
    e.budget = Number.isFinite(v) && v > 0 ? v : undefined;
    changed();
  }

  function setAmount(x: Expense, v: string) {
    const n = parseFloat(v);
    x.amount = Number.isFinite(n) ? n : undefined;
    changed();
  }
</script>

<section class="card stack">
  <label class="field">
    <span>💰 Budget for this event</span>
    <div class="money-input">
      <span>{cur}</span>
      <input class="input" type="number" inputmode="decimal" min="0" step="any" value={e.budget ?? ''} oninput={setBudget} placeholder="No limit" />
    </div>
  </label>
  {#if e.budget}
    <div class="progress" class:over={t.left !== undefined && t.left < 0}><span style="width:{pct}%"></span></div>
  {/if}
  <div class="tiles">
    <div class="tile"><strong>{fmtMoney(t.planned, cur)}</strong><span>planned</span></div>
    <div class="tile" style="--c: var(--green)"><strong>{fmtMoney(t.paid, cur)}</strong><span>paid</span></div>
    <div class="tile" style="--c: var(--amber)"><strong>{fmtMoney(t.owed, cur)}</strong><span>to pay</span></div>
    {#if t.left !== undefined}
      <div class="tile" style="--c: {t.left < 0 ? 'var(--red)' : 'var(--teal)'}">
        <strong>{fmtMoney(Math.abs(t.left), cur)}</strong><span>{t.left < 0 ? 'over' : 'left'}</span>
      </div>
    {/if}
  </div>
  {#if heads && t.planned}<p class="muted small" style="margin:0">About {fmtMoney(Math.round((t.planned / heads) * 100) / 100, cur)} per guest coming.</p>{/if}
</section>

<div class="card flush">
  {#each e.expenses as x (x.id)}
    <div class="trow">
      <button class="check" role="checkbox" aria-checked={x.paid} aria-label="Paid: {x.name}" onclick={() => ((x.paid = !x.paid), changed())}>
        {#if x.paid}<Icon name="check" size={18} stroke={3} />{/if}
      </button>
      <span class="trow-text">
        <input class="bare" bind:value={x.name} oninput={changed} aria-label="Expense" />
        <span class="small muted">{x.paid ? 'Paid' : 'Not paid yet'}</span>
      </span>
      <div class="money-input slim">
        <span>{cur}</span>
        <input class="input slim amount" type="number" inputmode="decimal" step="any" value={x.amount ?? ''} oninput={(ev) => setAmount(x, ev.currentTarget.value)} aria-label="Cost of {x.name}" />
      </div>
      <button class="remove-btn" aria-label="Remove {x.name}" onclick={() => remove(x)}><Icon name="x" size={18} /></button>
    </div>
  {/each}
  <form class="row add-row inside" style="flex-wrap:nowrap" onsubmit={add}>
    <input class="input" bind:value={name} placeholder="Add an expense" aria-label="Expense name" />
    <input class="input amount" type="number" inputmode="decimal" step="any" min="0" bind:value={amount} placeholder={cur} aria-label="Cost" />
    <button class="btn primary" disabled={!name.trim()} aria-label="Add"><Icon name="plus" /></button>
  </form>
</div>

{#if ideas.length}
  <div class="chips">
    {#each ideas as i (i)}
      <button class="chip small-chip" onclick={() => ((name = i), add())}>+ {i}</button>
    {/each}
  </div>
{/if}
