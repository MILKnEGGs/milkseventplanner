<script lang="ts">
  import { statusOf } from '../lib/data';
  import type { Rsvp } from '../lib/types';

  let { status, small = false }: { status: Rsvp; small?: boolean } = $props();
  const s = $derived(statusOf(status));
</script>

<span class="pill" class:small style="--c: var(--st-{status})">{s.emoji} {s.short}</span>
