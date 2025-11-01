<script lang="ts">

import '../app.css'

import type {Location} from '$lib/types/location';
import type { routeTable } from '$lib/server/db/schema';
import {addRoute, setPin} from '$lib/map/route';
import {onMount} from 'svelte';
import {createMap} from '$lib/map/map';
import type {Map} from 'ol';
	import type {Coordinate} from 'ol/coordinate';

let map: Map | null = null;

const currLine: typeof routeTable.$inferInsert = {coordinates: []};

let searchString: string = $state("");
let suggested_locs: Location[] = $state([]);

let statusText: HTMLDivElement | null = null;
let sent: boolean = $state(false);

let actions = $state<{name: string, active: boolean, funct: (id: string, c: Coordinate) => void}[]>([
  {
    name: "start",
    active: false,
    funct: setPin,
  },
  {
    name: "end",
    active: false,
    funct: setPin,
  },
  {
    name: "route",
    active: false,
    funct: addRoute,
  },

])

onMount(() => {
console.log("ehe")
 map = createMap();
})

$effect( () => {
  let timeoutList: NodeJS.Timeout[] = [];

  if (searchString) {
    timeoutList = [...timeoutList, setTimeout( async() => {
      fetch(`/search/${encodeURIComponent(searchString)}`).then( async (res) => {
        suggested_locs = await res.json();
      });
    }, 1000)];

  }

  if (sent && statusText) {
    statusText.style.opacity = "1";
    timeoutList = [...timeoutList, setTimeout( () => {statusText!.style.opacity = "0"}, 1000)];
  }

  return () => timeoutList.forEach(e => clearTimeout(e))
});
    

const onclick = async (e: MouseEvent & {currentTarget: EventTarget & HTMLDivElement}) => {

  if (!map) {
    return;
  }
  const v = actions.find(a => a.active);
  if (!v) {
    return;
  }

  const rect = map.getOverlayContainer().getBoundingClientRect();
  const loc = map.getCoordinateFromPixel([e.clientX - rect.left, e.clientY - rect.top])
  v.funct(v.name, loc);

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

<div class="w-full h-full flex flex-row">

  <div class="w-2/7">
    <button onclick={() => {
      actions = actions.map(a => {return {... a, active: false}})
      }}>reset</button>

    {#each actions as action}
      {@const onclick = () => {
      actions = actions.map(a => {return {... a, active: a.name == action.name ? true : false}})
      }}
      <button 
            class="bg-white p-1 m-2 disabled:bg-zinc-300 disabled:text-zinc-600"
            disabled={action.active}
            {onclick}
            >
            {action.name}
      </button>
    {/each}
    <p>Enter Route name before clicking on route: </p>
    <input type="text" bind:value={actions[2].name}/>
  </div>

  <div 
        id="map" 
        onkeypress={onkeypress} 
        onclick={onclick} 
        role="button" 
        tabindex="0"
        class="flex-1"
        >
        <p bind:this={statusText} class="min-w-10 bg-white w-[10em] rounded-sm transition-opacity opacity-0 absolute top-8/9 left-1/2 text-center py-2">
        route added!
        </p>
  </div>

</div>

