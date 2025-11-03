import type { transportRoutes } from "./schema";

type select = typeof transportRoutes.$inferSelect;
type insert = typeof transportRoutes.$inferInsert;

//mock the data, i don't care
const busRoutes: select[] = [];

export function insertBusRoute(r: insert) {
  busRoutes.push({...r, id: busRoutes.length});

}

export function getBusRoutes() {
  return busRoutes;
}
