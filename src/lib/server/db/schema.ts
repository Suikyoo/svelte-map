import { json } from '@sveltejs/kit';
import { pgTable, serial, integer, jsonb } from 'drizzle-orm/pg-core';

export const busTable = pgTable('bus', {
	id: serial('id').primaryKey(),
	fare: integer('age'),
});

export type Coordinates = Array<number>;

export const routeTable  = pgTable('routes', {
  id: serial('id').primaryKey(),
  coordinates: jsonb('coordinates').$type<Coordinates[]>().notNull(),
});


