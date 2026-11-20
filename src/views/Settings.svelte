<script lang="ts">
  import TopBar from '../components/TopBar.svelte';
  import { backupJson, newData, parseBackup } from '../lib/data';
  import { fileStamp, shareFile } from '../lib/files';
  import { app, isStandalone, replaceData, save, toast } from '../lib/store.svelte';
  import type { ThemeMode } from '../lib/types';

  let { offlineReady }: { offlineReady: boolean } = $props();

  let fileInput: HTMLInputElement;
  const CURRENCIES = ['$', '€', '£', '¥', '₹', 'R$', 'kr'];

  function setTheme(t: ThemeMode) {
    app.d.settings.theme = t;
    save();
  }

  async function exportBackup() {
    const file = new File([backupJson($state.snapshot(app.d))], `eventplanner-backup-${fileStamp()}.json`, { type: 'application/json' });
    await shareFile(file, "Milk's Event Planner backup");
  }

  async function importBackup(e: Event & { currentTarget: HTMLInputElement }) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    try {
      const d = parseBackup(await file.text());
      if (!confirm(`Replace everything on this device with this backup?\n\n${d.events.length} events.\n\nWhat's here now will be replaced.`)) return;
      await replaceData(d);
      toast('Backup restored ✓');
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function eraseAll() {
    const typed = prompt("Erase EVERYTHING on this device: every event, guest and to-do? This can't be undone.\n\nType ERASE to confirm.");
    if (typed?.trim().toUpperCase() !== 'ERASE') return;
    const fresh = newData();
    fresh.settings = { ...$state.snapshot(app.d.settings) };
    await replaceData(fresh);
    toast('Everything erased. Fresh start! 🎈');
  }
</script>

<TopBar title="Settings" />

<main class="page stack" style="gap:16px">
  <section class="card stack">
    <h3>💌 On your invitations</h3>
    <p class="muted small" style="margin:0">Used for the “Please RSVP to …” line, so guests know who to answer.</p>
    <label class="field">
      <span>Your name</span>
      <input class="input" bind:value={app.d.settings.name} oninput={save} placeholder="Milk" autocomplete="given-name" />
    </label>
    <label class="field">
      <span>Your phone (optional)</span>
      <input class="input" type="tel" bind:value={app.d.settings.phone} oninput={save} placeholder="555-0100" autocomplete="tel" />
    </label>
  </section>

  <section class="card stack">
    <h3>💵 Money</h3>
    <div class="field">
      <span>Currency sign</span>
      <div class="seg">
        {#each CURRENCIES as c (c)}
          <button class:on={app.d.settings.currency === c} onclick={() => ((app.d.settings.currency = c), save())}>{c}</button>
        {/each}
      </div>
    </div>
  </section>

  <section class="card stack">
    <h3>🎨 Look</h3>
    <div class="seg">
      <button class:on={app.d.settings.theme === 'light'} onclick={() => setTheme('light')}>🎊 Confetti</button>
      <button class:on={app.d.settings.theme === 'dark'} onclick={() => setTheme('dark')}>🌙 Party night</button>
      <button class:on={app.d.settings.theme === 'auto'} onclick={() => setTheme('auto')}>Match device</button>
    </div>
  </section>

  <section class="card stack">
    <h3>💾 Backup & move to another device</h3>
    <p class="muted small" style="margin:0">
      Everything is saved only on this device. Export a backup to keep a copy or move to a new phone, then <em>Import</em> it there. Importing
      <strong>replaces</strong> what's on that device.
    </p>
    <div class="row">
      <button class="btn primary" onclick={exportBackup}>⬆️ Export backup</button>
      <button class="btn" onclick={() => fileInput.click()}>⬇️ Import backup</button>
      <input bind:this={fileInput} type="file" accept=".json,application/json" hidden onchange={importBackup} />
    </div>
  </section>

  <section class="card stack">
    <h3>📲 Install on your phone</h3>
    <p class="muted small" style="margin:0">
      {#if isStandalone}
        ✓ You're using the installed app{offlineReady ? ' and it works offline' : ''}.
      {:else}
        Add the app to your Home Screen so it opens like an app and works with no signal.
      {/if}
    </p>
    <a class="btn" href="#/install">How to install</a>
  </section>

  <section class="card stack">
    <h3>Danger zone</h3>
    <button class="btn danger" onclick={eraseAll}>Erase everything on this device</button>
  </section>

  <p class="muted small center">
    Milk's Event Planner v{__APP_VERSION__} · made with 🎉 · <a href="https://milkneggs.github.io/pitch/milkseventplanner.html" target="_blank" rel="noopener">See what it does</a>
  </p>
</main>
