<script lang="ts">
  import { contactKind, countText, displayTitle, personalInvite, sendUrl, setStatus, STATUSES } from '../lib/data';
  import { copyText } from '../lib/actions';
  import { app, toast, touch } from '../lib/store.svelte';
  import type { Guest, PartyEvent, Rsvp } from '../lib/types';
  import Sheet from './Sheet.svelte';
  import Stepper from './Stepper.svelte';

  let { e, guest, onclose }: { e: PartyEvent; guest: Guest; onclose: () => void } = $props();

  const g = guest;
  let comingA = $state(g.comingAdults ?? g.adults);
  let comingK = $state(g.comingKids ?? g.kids);
  const kind = $derived(contactKind(g.contact));
  const changed = () => touch(e);

  function pick(s: Rsvp) {
    setStatus(g, s);
    if (s === 'yes') {
      comingA = g.comingAdults ?? g.adults;
      comingK = g.comingKids ?? g.kids;
    }
    changed();
  }

  function setComing() {
    g.comingAdults = comingA === g.adults ? undefined : comingA;
    g.comingKids = comingK === g.kids ? undefined : comingK;
    changed();
  }

  /** Invited counts changed: keep the coming counts in step unless they were set separately. */
  function invitedChanged() {
    if (g.comingAdults === undefined) comingA = g.adults;
    if (g.comingKids === undefined) comingK = g.kids;
    changed();
  }

  function send() {
    const url = sendUrl(g.contact ?? '', `You're invited: ${displayTitle(e)}`, personalInvite(e, app.d.settings, g));
    if (!url) return;
    location.href = url;
    if (g.status === 'list') {
      setStatus(g, 'invited');
      changed();
      toast(`Marked ${g.name} as invited`, { label: 'Undo', run: () => (setStatus(g, 'list'), changed()) });
    }
  }

  async function copyInvite() {
    if (await copyText(personalInvite(e, app.d.settings, g))) toast('Invitation copied 📋');
  }

  function remove() {
    if (!confirm(`Take ${g.name} off the guest list?`)) return;
    const i = e.guests.indexOf(g);
    const bringing = e.food.filter((f) => f.guestId === g.id);
    e.guests.splice(i, 1);
    for (const f of bringing) f.guestId = undefined;
    changed();
    onclose();
    toast(`Removed ${g.name}`, {
      label: 'Undo',
      run: () => {
        e.guests.splice(i, 0, g);
        for (const f of bringing) f.guestId = g.id;
        changed();
      },
    });
  }
</script>

<Sheet {onclose} label="Guest">
  <div class="stack">
    <input class="input title-input" bind:value={g.name} oninput={changed} aria-label="Name" placeholder="Name" />

    <div class="status-grid" role="radiogroup" aria-label="RSVP">
      {#each STATUSES as s (s.id)}
        <button role="radio" aria-checked={g.status === s.id} class:on={g.status === s.id} style="--c: var(--st-{s.id})" onclick={() => pick(s.id)}>
          <span class="st-emoji">{s.emoji}</span>{s.label}
        </button>
      {/each}
    </div>

    <div class="card soft stack tight">
      <strong class="small">Invited</strong>
      <Stepper label="Adults" bind:value={g.adults} onchange={invitedChanged} />
      <Stepper label="Kids" bind:value={g.kids} onchange={invitedChanged} />
    </div>

    {#if g.status === 'yes'}
      <div class="card soft stack tight">
        <strong class="small">Coming <span class="muted">({countText({ adults: comingA, kids: comingK })})</span></strong>
        <Stepper label="Adults" bind:value={comingA} onchange={setComing} />
        <Stepper label="Kids" bind:value={comingK} onchange={setComing} />
      </div>
    {/if}

    <label class="field">
      <span>📱 Phone or email</span>
      <input class="input" bind:value={g.contact} oninput={changed} placeholder="For sending the invitation" autocomplete="off" />
    </label>
    <div class="row">
      {#if kind}
        <button class="btn primary" onclick={send}>{kind === 'phone' ? '💬 Text the invitation' : '📧 Email the invitation'}</button>
      {/if}
      <button class="btn" onclick={copyInvite}>📋 Copy invitation</button>
    </div>

    <label class="field">
      <span>🥜 Allergies / dietary needs</span>
      <input class="input" bind:value={g.diet} oninput={changed} placeholder="Peanuts, vegetarian, gluten-free…" />
    </label>
    <label class="field">
      <span>Notes</span>
      <input class="input" bind:value={g.notes} oninput={changed} placeholder="Ava's friend from swim class" />
    </label>

    <div class="row sheet-actions">
      <button class="btn danger ghost" onclick={remove}>Remove</button>
      <span class="spacer"></span>
      <button class="btn primary" onclick={onclose}>Done</button>
    </div>
  </div>
</Sheet>
