import { fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { transportRoutes } from "$lib/server/db/schema";
import { getBusRoutes, insertBusRoute } from "$lib/server/db/bus";

export const load: PageServerLoad = async () => {
  const routes = getBusRoutes();
  return {
    routes: routes || [],
  };
}

export const actions = {
  default: async ({request}) => {
    const data = await request.formData()

    const name = data.get("name")!.toString()

    const fare = Number(data.get("fare"));

    const parsible = data.get("coordinates")?.toString();

    if (!parsible) {
      return fail(400, "incorrect coordinate values");
    }

    const coordinates = JSON.parse(parsible);

    const busRoute: typeof transportRoutes.$inferInsert = {name, fare, coordinates};
    insertBusRoute(busRoute);
    return {success: true}


  }
} satisfies Actions;
