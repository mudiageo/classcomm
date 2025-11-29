import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { ServerSyncEngine } from 'sveltekit-sync/server';
import { DrizzleAdapter } from 'sveltekit-sync/adapters/drizzle';
import { syncSchema } from './sync-schema';

const adapter = new DrizzleAdapter({ db, schema })
export const syncEngine = new ServerSyncEngine(adapter, syncSchema);
