<script lang="ts">
  import { copyText } from '../../lib/actions';
  import {
    budgetTotals,
    countText,
    daysUntil,
    displayTitle,
    fmtDate,
    fmtMoney,
    fmtShort,
    headcount,
    kindOf,
    mapsUrl,
    ordinal,
    overdueRsvps,
    people,
    placeLine,
    relDays,
    taskDue,
    timeRange,
  } from '../../lib/data';
  import { app, isApple, toast, today } from '../../lib/store.svelte';
  import type { PartyEvent } from '../../lib/types';
  import RsvpBar from '../../components/RsvpBar.svelte';

  let { e, onedit, oninvite, oncalendar }: { e: PartyEvent; onedit: () => void; oninvite: () => void; oncalendar: () => void } = $props();

  const n = $derived(daysUntil(e, today.s));
  const h = $derived(headcount(e));
  const late = $derived(overdueRsvps(e, today.s));
  const money = $derived(budgetTotals(e));
  const cur = $derived(app.d.settings.currency);
  const where = $derived(placeLine(e.place));
  const nextTasks = $derived(
    e.tasks
      .filter((t) => !t.done)
      .map((t) => ({ t, due: taskDue(e, t) }))
      .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
      .slice(0, 3),
  );
  const sub = $derived(
    [e.honoree && e.kind === 'birthday' && e.age ? `${e.honoree} turns ${e.age}` : e.honoree ? `For ${e.honoree}` : '', kindOf(e.kind).label]
      .filter(Boolean)
      .join(' · '),
  );

  async function copyAddress() {
    if (await copyText(where)) toast('Address copied 📋');
  }
</script>

<section class="card hero-card">
  <span class="hero-emoji" aria-hidden="true">{e.emoji}</span>
  <h2>{displayTitle(e)}</h2>
  <p class="muted" style="margin:0">{sub}{e.age && e.kind === 'wedding' ? ` · ${ordinal(e.age)}` : ''}</p>
  {#if n !== undefined}
    <div class="countdown-big" class:past={n < 0}>
      {#if n === 0}🎉 It's party day!{:else if n > 0}<strong>{n}</strong> day{n === 1 ? '' : 's'} to go{:else}Was {relDays(n)}{/if}
    </div>
  {/if}
  <dl class="facts">
    <div>
      <dt>📅</dt>
      <dd>
        {#if e.date}<strong>{fmtDate(e.date)}</strong>{e.start ? ` · ${timeRange(e.start, e.end)}` : ''}{:else}<button class="link-btn" onclick={onedit}>Pick a date</button>{/if}
      </dd>
    </div>
    {#if e.rsvpBy}
      <div>
        <dt>✉️</dt>
        <dd>RSVP by {fmtShort(e.rsvpBy)}</dd>
      </div>
    {/if}
    {#if e.theme}
      <div>
        <dt>🎨</dt>
        <dd>{e.theme}</dd>
      </div>
    {/if}
  </dl>
  <div class="row">
    <button class="btn primary" onclick={oninvite}>💌 Invitation</button>
    <button class="btn" onclick={oncalendar}><span aria-hidden="true">📅</span> Calendar</button>
    <button class="btn ghost" onclick={onedit}>✏️ Edit</button>
  </div>
</section>

<section class="card stack tight">
  <div class="sec-head"><h3>📍 Where</h3></div>
  {#if where}
    <div>
      {#if e.place.name}<strong>{e.place.name}</strong><br />{/if}
      {#if e.place.address}<span class="muted">{e.place.address}</span>{/if}
    </div>
    {#if e.place.notes}<p class="small" style="margin:0">{e.place.notes}</p>{/if}
    <div class="row">
      <a class="btn small" href={mapsUrl(e.place, isApple)} target="_blank" rel="noopener">🗺️ Open map</a>
      <button class="btn small" onclick={copyAddress}>📋 Copy</button>
    </div>
  {:else}
    <button class="btn" onclick={onedit}>Add the place</button>
  {/if}
</section>

<a class="card stack tight plain-link" href="#/e/{e.id}/guests">
  <div class="sec-head">
    <h3>👥 Guests</h3>
    <span class="muted small">{e.guests.length ? `${e.guests.length} household${e.guests.length === 1 ? '' : 's'}` : ''} ›</span>
  </div>
  {#if e.guests.length}
    <RsvpBar guests={e.guests} />
    <div class="tiles">
      <div class="tile" style="--c: var(--st-yes)"><strong>{people(h.yes)}</strong><span>coming</span></div>
      <div class="tile" style="--c: var(--st-maybe)"><strong>{people(h.maybe)}</strong><span>maybe</span></div>
      <div class="tile" style="--c: var(--st-invited)"><strong>{h.invited.households}</strong><span>waiting</span></div>
      <div class="tile" style="--c: var(--st-no)"><strong>{h.no.households}</strong><span>can't</span></div>
    </div>
    {#if h.yes.households}<span class="small muted">Coming: {countText(h.yes)}</span>{/if}
    {#if h.list.households}<span class="small">📝 {h.list.households} not invited yet</span>{/if}
    {#if late}<span class="small warn-text">⏰ {late} still haven't answered and the RSVP date has passed</span>{/if}
  {:else}
    <span class="muted">No guests yet. Tap to start the list.</span>
  {/if}
</a>

<a class="card stack tight plain-link" href="#/e/{e.id}/todo">
  <div class="sec-head">
    <h3>☑️ Next up</h3>
    <span class="muted small">{e.tasks.filter((t) => t.done).length}/{e.tasks.length} done ›</span>
  </div>
  {#each nextTasks as x (x.t.id)}
    <div class="mini-task">
      <span>{x.t.text}</span>
      {#if x.due}<span class="small" class:warn-text={x.due < today.s} class:muted={x.due >= today.s}>{x.due < today.s ? 'overdue' : fmtShort(x.due)}</span>{/if}
    </div>
  {:else}
    <span class="muted">{e.tasks.length ? 'All done! 🎉' : 'No to-dos yet. Tap for a starter checklist.'}</span>
  {/each}
</a>

{#if e.expenses.length || e.budget}
  <a class="card stack tight plain-link" href="#/e/{e.id}/budget">
    <div class="sec-head"><h3>💵 Budget</h3><span class="muted small">›</span></div>
    <span>
      <strong>{fmtMoney(money.planned, cur)}</strong> planned{e.budget !== undefined ? ` of ${fmtMoney(e.budget, cur)}` : ''}
      {#if money.owed}<span class="muted"> · {fmtMoney(money.owed, cur)} still to pay</span>{/if}
    </span>
    {#if money.left !== undefined && money.left < 0}<span class="small warn-text">Over budget by {fmtMoney(-money.left, cur)}</span>{/if}
  </a>
{/if}

{#if e.notes}
  <section class="card">
    <h3>📝 Notes</h3>
    <p style="margin:6px 0 0; white-space: pre-wrap">{e.notes}</p>
  </section>
{/if}
