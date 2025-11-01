
import { Feature, Map, } from 'ol'
import { Polyline } from 'ol/format'
import {osrmSource, pinSource, routeSource} from './map';
import type {Coordinate} from 'ol/coordinate';
import {Geometry, LineString, Point} from 'ol/geom';
import type {Vector} from 'ol/source';
import type {RouteData} from '../../routes/map/pathfind/+server';
import {toLonLat} from 'ol/proj';

export function codeToCoord(plineCode: string): Coordinate[] {
  const plineFormat = new Polyline(); const geometry = plineFormat.readGeometry(plineCode, {featureProjection: 'EPSG:3857'});

  if (geometry instanceof LineString) {
    return geometry.getCoordinates()

  } else {
    throw new Error();

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
export async function addRoute(id: string, c: Coordinate): Promise<void> {
  let feature: Feature<LineString> | null = routeSource.getFeatureById(id);

  if (!feature) {
    console.log("initial:", c);
    feature = new Feature({geometry: new LineString([])});
    createFeature(feature, id, routeSource);
  }
  
  let coordinates = feature.getGeometry()?.getCoordinates();

  if (!coordinates) {
    throw new Error();
  }

  if (coordinates.length > 0) {
    let params = new URLSearchParams();
    params.append("coord", toLonLat(coordinates[coordinates.length - 1]).join(","))
    params.append("coord", toLonLat(c).join(","));
    const res = await fetch(`/map/pathfind?${params.toString()}`);
    const {routes}: RouteData = await res.json();
    console.log(codeToCoord(routes.geometry))
    coordinates = [...coordinates, ...codeToCoord(routes.geometry)];
  }

  feature.getGeometry()?.setCoordinates([...coordinates, c])

}

function createFeature(feature: Feature, id: string, src: Vector): void {
  feature.setId(id);
  src.addFeature(feature);

}

