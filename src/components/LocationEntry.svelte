
<script lang="ts">
  import type { Location } from  "$lib/types/location"
  interface Props {
    location: Location;
  }
  let { location }: Props = $props();

</script>
<div class="prose text-xs bg-slate-100 m-1 box-border p-2">
  <h3>{location.name}</h3>
  <p>{location.display_name}</p>
</div>
