import {json} from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  const baseApi = "https://nominatim.openstreetmap.org";
  const res = await fetch(baseApi + `/search?q=${params.query}&format=json`);
  const data = await res.json();
  return json(data);
}
