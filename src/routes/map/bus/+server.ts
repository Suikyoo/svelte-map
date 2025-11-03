import { db } from "$lib/server/db";
import { error, text, type RequestHandler } from "@sveltejs/kit";
import { routeTable } from '$lib/server/db/schema';


export const POST: RequestHandler = async ({request}) => {
  try {
    const route: typeof routeTable.$inferInsert = await request.json();
    await db.insert(routeTable).values(route);
    return text("successfully inserted values");

  } catch (e) {
    return error(401, "Client error")
  }

}
