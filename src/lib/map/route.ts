
import type { Coordinates } from '$lib/server/db/schema';
import { Feature, Map, } from 'ol'
import { Polyline } from 'ol/format'

import { LineString } from 'ol/geom'
import { Vector } from 'ol/source'

export function drawRoute(src: Vector, plineCode: string) {
  const plineFormat = new Polyline();
  const geometry = plineFormat.readGeometry(plineCode, {featureProjection: 'EPSG:3857'})

  //only one feature(with geometry) is allowed in this layer
  src.clear()
  src.addFeature( new Feature({ geometry }))
}



