import type { Data } from "$lib/map/route";
import {json, type RequestHandler} from "@sveltejs/kit";

export const GET: RequestHandler = async ({url}) => {
  const coordinates = url.searchParams.get("coords");
  const res = await fetch(`http://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full`)
  const data: Data = await res.json()

  return json(data);

}
