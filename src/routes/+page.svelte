<script lang="ts">

import '../app.css'

import {addRoute, setPath, setPin, stateData} from '$lib/map/route.svelte';
import {onMount} from 'svelte';
import {createMap, pinSource, routeSource, seedMap} from '$lib/map/map';
import type {Map} from 'ol';
import type {Coordinate} from 'ol/coordinate';
import {enhance} from '$app/forms';
import type { PageData, PageProps } from './$types';

/*
let searchString: string = $state("");
let suggested_locs: Location[] = $state([]);
*/

let map: Map | null = null;
let clickPulse: number = $state(0);

let statusText: HTMLDivElement | null = null;
let statusPulse: number = $state(0);

let {data}: PageProps = $props();

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

let totalCost = $derived.by(() => {
  
});
onMount(() => {
  map = createMap();
  seedMap(data.routes)

})

$effect( () => {
  let timeoutList: NodeJS.Timeout[] = [];

  /*
  if (searchString) {
    timeoutList = [...timeoutList, setTimeout( async() => {
      fetch(`/search/${encodeURIComponent(searchString)}`).then( async (res) => {
        suggested_locs = await res.json();
      });
    }, 1000)];

  }
  */
  if (clickPulse) {
    timeoutList = [...timeoutList, setTimeout(() => setPath(), 1000)];

  }
  if (statusPulse && statusText) {
    statusText.style.opacity = "1";
    timeoutList = [...timeoutList, setTimeout( () => {statusText!.style.opacity = "0"}, 3000)];
  }

  return () => timeoutList.forEach(e => clearTimeout(e))
});
    

const onclick = async (e: MouseEvent & {currentTarget: EventTarget & HTMLDivElement}) => {
  clickPulse = (clickPulse + 1) % 2;

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
    {#if actions[2].active}
      <form 
        method="POST" 
        use:enhance={
        ({formData}) => {
        const name = formData.get("name")?.toString()
        formData.set("coordinates", JSON.stringify(routeSource.getFeatureById(name || "")?.getGeometry()?.getCoordinates()))

        return async ({result}) => {
        console.log(result.type);
        if (result.type == "success") {
        statusPulse = 1 + (statusPulse % 2);
        }
        }

        }}>
        <p>Enter Route info before clicking on a route: </p>
        <label>
          Name: 
          <input type="text" name="name" bind:value={actions[2].name} required/>
        </label>

        <label>
          Fare: 
          <input type="text" name="fare" required/>
        </label>

        <input class="bg-blue-600 text-white p-1 rounded-md" type="submit" value="Submit" />

      </form>
    {/if}
    <div>
      {#each stateData.result as res}
        {@const fare = data.routes.find(v => v.name == res.id)?.fare}
        <div>
          <b>{res.id}</b>
          <p>distance: {res.distance.toFixed(2)} meters</p>
          <p>fare: {fare} Php / Km</p>
          <p>cost: PHP { ((fare || 0) * (res.distance/1000)).toFixed(2) }</p>
        </div>
      {/each}
      <p><b>total cost: </b> </p>
    </div>
    <div>
        
    </div>
  </div>

  <div 
    id="map" 
    onkeypress={null} 
    onclick={onclick} 
    role="button" 
    tabindex="0"
    class="flex-1"
  >
    <p bind:this={statusText} class="min-w-10 bg-white w-[10em] rounded-sm transition-opacity opacity-0 absolute z-1 top-8/9 left-1/2 text-center py-2">
      route added!
    </p>
  </div>
</div>

