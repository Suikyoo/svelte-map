
<script lang="ts">
  import type { Location } from  "$lib/types/location"
  import LocationEntry from "./LocationEntry.svelte"
  interface Props {
    value: string;
    locations: Location[],
  }
  let { value = $bindable(), locations}: Props = $props();
</script>

<div class="flex flex-col z-1">
  <input bind:value={value} type="text"/>
  <div class="overflow-y-scroll overflow-x-hidden h-100">
    {#each locations as location (location.osm_id)}
      <LocationEntry {location} />
    {/each}
  </div>
</div>
