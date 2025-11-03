
import { Feature, Map, } from 'ol'
import { Polyline } from 'ol/format'
import {pathSource, pinSource, routeSource, segmentSource} from './map';
import {distance, type Coordinate} from 'ol/coordinate';
import {LineString, Point} from 'ol/geom';
import type {Vector} from 'ol/source';
import {fromLonLat, toLonLat} from 'ol/proj';
import { isEquals } from '$lib/utils/array';


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
  coordinates: Coordinate[],
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
      const c = codeToCoords(userRoute.geometry)
      const path = new Feature({geometry: new LineString(c)});
      path.setId(userRoute.geometry);
      pathSource.addFeature(path);

      let currLoc = start;
      let maxSegment: Segment & { id: string} = {coordinates: [], distance: 0, id: ""};
      for (const busRoute of busRoutes) {
        const s = getSegmentatPoint(c.map(v => toLonLat(v)), busRoute.coordinates.map(v => toLonLat(v)), currLoc);
        if (s.distance > maxSegment.distance) {
          maxSegment = {...s, id: busRoute.id || ""};
        }
      }
      const segment = new Feature({geometry: new LineString(maxSegment.coordinates.map(v => fromLonLat(v)))});
      segment.setId(maxSegment.id);
      segmentSource.addFeature(segment);
      /*
      while (curr_loc != end) {
        console.log(curr_loc, end);
        let maxSegment: Segment & { id: string} = {coordinates: [], distance: 0, id: ""};

        for (const busRoute of busRoutes) {
          const s = getSegmentatPoint(c, busRoute.coordinates, curr_loc);
          console.log(s);
          if (s.distance > maxSegment.distance) {
            maxSegment = {...s, id: busRoute.id || ""};
          }
        }

        const segment = new Feature({geometry: new LineString(maxSegment.coordinates)});
        segment.setId(maxSegment.id);
        segmentSource.addFeature(segment);

      }
      */
    }
  }



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

//by having an anchor(starting) coordinate. I can try to determine the direction
//This also fits well for the main purpose of this function to have a starting coordinate to check for.

//due to circumstances, a here is the reference coordinates. 
//Just know that you can't mix a and b interchangeably as arguments to this function 
function getSegmentatPoint(a: Coordinate[], b: Coordinate[], anchor: Coordinate): Segment {

  let length = 0;
  let start_index = a.findIndex(c => isEquals<number>(c, anchor));
  let b_index = b.findIndex(c => isEquals<number>(c, anchor));

  let direction = 0;

  //we're supposed to assume that a is the correct order of coordinates
  for (const d of [-1, 1]) {
    if (isEquals(a.at(start_index + 1), b.at(b_index + d))) {
      direction = d;
    }
  }

  for (let i=start_index; i<a.length; i++) {
    if (isEquals(b.at(b_index), a.at(i))) {
      length += 1;
    } 
    else {
      break;
    }

    b_index += direction;

  }

  const coordinates = a.slice(start_index, start_index + length);
  const distance = new LineString(coordinates).getLength();
  return {coordinates, distance};
}
