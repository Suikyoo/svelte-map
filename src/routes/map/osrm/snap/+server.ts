import type { Data } from "$lib/map/route";
import {json, type RequestHandler} from "@sveltejs/kit";

export const GET: RequestHandler = async ({url}) => {
  const coord = url.searchParams.get("coord");
  const bearings = url.searchParams.get("bearings");
  const res = await fetch(`http://router.project-osrm.org/nearest/v1/driving/${coord}?number=1&bearings=${bearings}`)
  const data: Data = await res.json()

  return json(data);

}
