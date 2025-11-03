
import { Feature, Map, } from 'ol'
import { Polyline } from 'ol/format'
import {pathSource, pinSource, routeSource, segmentSource} from './map';
import {distance, type Coordinate} from 'ol/coordinate';
import {LineString, Point} from 'ol/geom';
import type {Vector} from 'ol/source';
import {fromLonLat, toLonLat} from 'ol/proj';
import { isEquals } from '$lib/utils/array';

export const stateData: {result: {id: string, distance: number}[]} = $state({result: []});

export interface Data {
  routes?: {
    distance: number, 
    duration: number, 
    geometry: string,
  }[],
  waypoints?: {
    name: string,
    location: Coordinate,
    distance: number,
    hint: string,
  }[],
}

export interface Segment {
  range: number[];
  distance: number,
}

export async function pathFind(coords: Coordinate[]): Promise<Data> {
  if (coords.length < 2) {
    throw new Error("needs 2 or more coordinates")
  }
  const res = await fetch(`/map/osrm/route?coords=${coords.map(c => c.join(",")).join(";")}`);

  const data: Data = await res.json();
  return data;

} 

export async function snap(coord: Coordinate, bearings: [number, number]) {
  const res = await fetch(`/map/osrm/snap?coord=${coord.join(",")}&bearings=${bearings.join(",")}`);
  const data: Data = await res.json();

  return data

}

export function codeToCoords(plineCode: string): Coordinate[] {
  const plineFormat = new Polyline(); 
  const geometry = plineFormat.readGeometry(plineCode, {featureProjection: 'EPSG:3857'});

  if (geometry instanceof LineString) {
    return geometry.getCoordinates()

  } else {
    throw new Error();

  }
}

export async function setPath(): Promise<void> {
  pathSource.clear();
  segmentSource.clear();
  let [start, end] = ["start", "end"].map(v => pinSource.getFeatureById(v)?.getGeometry()?.getCoordinates());

  if (!start || !end) {
    console.log("start/end value may be missing")
    return;
  }

  start = toLonLat(start);
  end = toLonLat(end);

  start = (await snap(start, [0,180])).waypoints?.at(0)?.location || start;
  end = (await snap(end, [0,180])).waypoints?.at(0)?.location || end;

  const busRoutes = routeSource.getFeatures().map(f => { return {id: f.getId()?.toString(), coordinates: f.getGeometry()?.getCoordinates() || []}});
  const {routes} = await pathFind([start, end]);

  if (routes) {
    for (const userRoute of routes) {
      let c = codeToCoords(userRoute.geometry)
      const path = new Feature({geometry: new LineString(c)});
      path.setId(userRoute.geometry);
      pathSource.addFeature(path);

      while (c.length > 1) {
        let maxSegment = [-1, -1]
        let segmentId: string = "";

        for (const busRoute of busRoutes) {
          const s = getSegment(c.map(v => toLonLat(v)), busRoute.coordinates.map(v => toLonLat(v)));
          if (s[1] - s[0] > maxSegment[1] - maxSegment[0]) {
            maxSegment = [...s];
            segmentId = busRoute.id || "";
          }
        }
        if (maxSegment.every(v => v == -1)) {
          break;
        }

        const segment = new Feature({geometry: new LineString(c.slice(maxSegment[0], maxSegment[1] + 1))});
        segment.setId(segmentId);
        segmentSource.addFeature(segment);

        c = c.toSpliced(maxSegment[0], maxSegment[1] - maxSegment[0] + 1)

      }
    }
  }
  stateData.result = segmentSource.getFeatures().map(f => ({id: f.getId()?.toString() || "", distance: f.getGeometry()?.getLength() || 0}))

}

export async function setPin(id: string, c: Coordinate): Promise<void> {

  //find feature
  let feature: Feature<Point> | null = pinSource.getFeatureById(id);

  //create feature if not
  if (!feature) {
    feature = new Feature({geometry: new Point(c)});
    createFeature(feature, id, pinSource);
    return;
  }

  feature.getGeometry()?.setCoordinates(c);

} 
export async function addRoute(id: string, coord: Coordinate): Promise<void> {
  let feature: Feature<LineString> | null = routeSource.getFeatureById(id);
  const {waypoints} = await snap(toLonLat(coord), [0,180]);

  let snappedCoord = coord;

  if (waypoints) {
    snappedCoord = fromLonLat(waypoints[0].location); 
  }

  if (!feature) {
    feature = new Feature({geometry: new LineString([])});
    createFeature(feature, id, routeSource);
  }
  
  let coordinates = feature.getGeometry()?.getCoordinates();

  if (!coordinates) {
    throw new Error();
  }

  if (coordinates.length > 0) {
    const {routes} = await pathFind([coordinates[coordinates.length - 1], snappedCoord].map(c => toLonLat(c)));
    if (routes){
      coordinates = [...coordinates, ...codeToCoords(routes[0].geometry)];
    }
  }

  else {
    coordinates = [...coordinates, snappedCoord];
  }

  feature.getGeometry()?.setCoordinates([...coordinates]);

}

function createFeature(feature: Feature, id: string, src: Vector): void {
  feature.setId(id);
  src.addFeature(feature);

}

//I realized I did not account for the order of coordinates. 
//the same string of coordinates would look the same if reversed,
//whether you start from the start point to end point or vice versa

//due to circumstances, a here is the reference coordinates. 
//Just know that you can't mix a and b interchangeably as arguments to this function 

//update: changed the function to just get the points of intersection
//returns the first segment that matches the "a" coordinate
function getSegment(a: Coordinate[], b: Coordinate[]): number[] {
  let range = [-1, -1];

  const check = (coord: Coordinate, coords: Coordinate[]): boolean => {
    for (let j = 0; j < coords.length; j++) {
      if (isEquals(coord, coords[j])) {
        return true;
      }
    }
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (check(a[i], b)){
      if (range[0] == -1) {
        range[0] = i;
      }
      range[1] = i;
    }
    else {
      if (range[0] != -1) {
        return range;
      }
    }
  }
  return range;
  //const distance = new LineString(coordinates).getLength();
}
