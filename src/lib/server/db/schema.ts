import { json } from '@sveltejs/kit';
import { pgTable, serial, integer, jsonb, varchar } from 'drizzle-orm/pg-core';
import type { Coordinate } from 'ol/coordinate';

export const transportRoutes  = pgTable('transport_routes', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),

  fare: integer('fare').notNull(),
  coordinates: jsonb('coordinates').$type<Coordinate[]>().notNull(),
});


