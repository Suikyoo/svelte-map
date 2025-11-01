
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
import type {LineString, Point} from 'ol/geom';

export const osrmSource = new source.Vector<Feature<LineString>>();
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
    source: osrmSource,
  }));

  map.addLayer(new layer.Vector({
    source: routeSource,
    style: (f) => (
      new Style({
        stroke: new Stroke({color: hashColor(f.getId()), width: 4})
      })
    )
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

