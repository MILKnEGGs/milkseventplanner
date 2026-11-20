<script lang="ts">
  let {
    value = $bindable(0),
    label,
    min = 0,
    onchange,
  }: { value: number; label: string; min?: number; onchange?: () => void } = $props();

  function step(n: number) {
    value = Math.max(min, Math.min(99, value + n));
    onchange?.();
  }
</script>

<div class="stepper">
  <span class="stepper-label">{label}</span>
  <button type="button" aria-label="One fewer ({label})" disabled={value <= min} onclick={() => step(-1)}>−</button>
  <strong aria-live="polite">{value}</strong>
  <button type="button" aria-label="One more ({label})" onclick={() => step(1)}>+</button>
</div>
