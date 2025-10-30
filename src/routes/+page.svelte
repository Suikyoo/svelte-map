<script lang="ts">

import '../app.css'
import {Map, View } from 'ol'
import * as source from 'ol/source'
import * as layer from 'ol/layer'
import TileLayer from 'ol/layer/Tile'
import {onMount} from 'svelte';

import type {Location} from '$lib/types/location';
import { fromLonLat, toLonLat } from 'ol/proj';
import type { routeTable } from '$lib/server/db/schema';

let map: Map | null = $state(null);

const osrmSource = new source.Vector();

onMount(() => {

  map = new Map({
    target: 'map',
    layers: [
      new TileLayer({source: new source.OSM(),}),
    ],
    view: new View({
      center: fromLonLat([123.8854, 10.3157]),
      zoom: 15,
    })

  });

  const vectorLayer = new layer.Vector({
    source: osrmSource,
  });

  map.addLayer(vectorLayer);

});

const currLine: typeof routeTable.$inferInsert = {coordinates: []};
let searchString: string = $state("");
let suggested_locs: Location[] = $state([]);

let statusText: HTMLDivElement | null = null;
let sent: boolean = $state(false);

$effect( () => {
  let timeoutList: NodeJS.Timeout[] = [];

  if (searchString) {
    timeoutList = [...timeoutList, setTimeout( async() => {
      fetch(`/search/${encodeURIComponent(searchString)}`).then( async (res) => {
        suggested_locs = await res.json();
      });
    }, 1000)];

  }

  if (sent) {
    statusText.style.opacity = "1";
    timeoutList = [...timeoutList, setTimeout( () => {statusText.style.opacity = "0"}, 1000)];
  }

  return () => timeoutList.forEach(e => clearTimeout(e))
});
    

const onclick = async (e: MouseEvent & {currentTarget: EventTarget & HTMLDivElement}) => {
  const loc = toLonLat([e.clientX, e.clientY]);
  currLine.coordinates = [...currLine.coordinates, loc];
  

}
const onkeypress = async (e: KeyboardEvent & {currentTarget: EventTarget & HTMLDivElement}) => {
  if (e.key == "Enter") {
    const res = await fetch("/map/route", {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(currLine),
    });

    if (res.ok) {
      sent = !sent;

    } else {

    }
  }
}

</script>

<div id="map" onkeypress={onkeypress} onclick={onclick} role="button" tabindex="0">
</div>
<div class="w-screen flex flex-row justify-center">

</div>

<p bind:this={statusText} class="bg-white w-[10em] rounded-sm transition-opacity opacity-0 relative top-8/9 left-1/2 text-center py-2">
  route added!
</p>

