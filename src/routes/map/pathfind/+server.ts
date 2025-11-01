import {json, type RequestHandler} from "@sveltejs/kit";

export interface RouteData {
  routes: {
    distance: number, 
    duration: number, 
    geometry: string,
  },
}

export const GET: RequestHandler = async ({url}) => {
  const coordinates = url.searchParams.getAll("coord");
  console.log(`link bwhaha: http://router.project-osrm.org/route/v1/driving/${coordinates.join(";")}?overview=simplified`);
  const res = await fetch(`http://router.project-osrm.org/route/v1/driving/${coordinates.join(";")}?overview=simplified`)
  const data: RouteResponse = await res.json()

  return json(data);

}
