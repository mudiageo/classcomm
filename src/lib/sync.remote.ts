import { query, command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { syncEngine as serverSync } from '$lib/server/sync';
import { auth } from '$lib/auth';


// Validation schemas
const SyncOperationSchema = v.object({
    id: v.string(),
    table: v.string(),
    operation: v.picklist(['insert', 'update', 'delete']),
    data: v.any(),
    timestamp: v.date(),
    clientId: v.string(),
    version: v.number(),
    status: v.picklist(['pending', 'synced', 'error'])
});

const SyncOperationsArraySchema = v.array(SyncOperationSchema);

// Push local changes to server
export const pushChanges = command(
    v.array(SyncOperationsArraySchema),
    async (operations) => {
        const { request } = getRequestEvent()
        const userId = await getUserId(request);
        return await serverSync.push(operations, userId);
    }
);

// Pull server changes to local
export const pullChanges = query(
    v.object({
        lastSync: v.number(),
        clientId: v.string()
    }),
    async ({ lastSync, clientId }) => {
        const { request } = getRequestEvent()
        const userId = await getUserId(request);
        return await serverSync.pull(lastSync, clientId, userId);
    }
);

// Helper to get authenticated user ID using better-auth
async function getUserId(request: Request): Promise<string> {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    if (!session) {
        throw new Error('Unauthorized');
    }

    return session.user.id;
}
