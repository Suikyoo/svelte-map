
import {Feature, Map, View } from 'ol'
import * as source from 'ol/source'
import * as layer from 'ol/layer'
import TileLayer from 'ol/layer/Tile'
import {fromLonLat} from 'ol/proj';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import {hashColor} from '$lib/utils/color';
import {LineString, type Point} from 'ol/geom';
import type { transportRoutes } from '$lib/server/db/schema';

//pin source: start and end points
//route source: collection of routes to be taken by vehicles
//path source: osrm-calculated path
//segment source: matches routes between calculated path and the vehicle routes

export const pathSource = new source.Vector<Feature<LineString>>();
export const segmentSource = new source.Vector<Feature<LineString>>();
export const pinSource = new source.Vector<Feature<Point>>();
export const routeSource = new source.Vector<Feature<LineString>>();

export function createMap() {
  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({source: new source.OSM(),}),
    ],
    view: new View({
      center: fromLonLat([123.8854, 10.3157]),
      zoom: 15,
    })

  });

  map.addLayer(new layer.Vector({
    source: routeSource,
    style: (f) => (
      new Style({
        stroke: new Stroke({color: hashColor(f.getId()), width: 2, lineDash: [10, 10], lineJoin: "round"})
      })
    )
  }));

  map.addLayer(new layer.Vector({
    source: pathSource,
    style: new Style({
      stroke: new Stroke({color: "#555", width: 3,})
    })
  }));

  map.addLayer(new layer.Vector({
    source: segmentSource,
    style: new Style({
      stroke: new Stroke({color: "yellow", width: 4,})
    })
  }));

  map.addLayer(new layer.Vector({
    source: pinSource,
    style: (f) => (
      new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({color: "white"}),
          stroke: new Stroke({color: (f.getId() == "start" ? "green" : "red"), width: 8})
        })
      })
    )
  }));
  return map;

}

export function seedMap(routes: typeof transportRoutes.$inferSelect[]) {
  for (const r of routes) {
    let f: Feature<LineString> | null;
    f = routeSource.getFeatureById(r.name);
    if (!f) {
      f = new Feature({geometry: new LineString(r.coordinates)});
      f.setId(r.name);
      routeSource.addFeature(f);
    }
  }
}
