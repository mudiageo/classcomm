import { sql } from 'drizzle-orm';
import type { SyncSchema } from 'sveltekit-sync/server';

export const syncSchema: SyncSchema = {
    tables: {
        students: {
            table: 'students',
            columns: ['id', 'userId', 'firstName', 'lastName', 'grade', 'class', 'notes', 'createdAt', '_version', '_updatedAt', '_clientId', '_isDeleted'],
            // Row-level security - only sync teacher's own students
            where: (userId: string) => sql`user_id = ${userId}`,
            conflictResolution: 'last-write-wins'
        },
        contacts: {
            table: 'contacts',
            columns: ['id', 'userId', 'studentId', 'name', 'relationship', 'email', 'phone', 'preferredMethod', 'preferredLanguage', 'notes', 'createdAt', '_version', '_updatedAt', '_clientId', '_isDeleted'],
            where: (userId: string) => sql`user_id = ${userId}`,
            conflictResolution: 'last-write-wins'
        },
        communications: {
            table: 'communications',
            columns: ['id', 'userId', 'studentId', 'contactId', 'subject', 'message', 'translatedMessage', 'targetLanguage', 'tone', 'status', 'method', 'scheduledFor', 'sentAt', 'templateId', 'tags', 'followUpDate', 'followUpCompleted', 'createdAt', '_version', '_updatedAt', '_clientId', '_isDeleted'],
            where: (userId: string) => sql`user_id = ${userId}`,
            conflictResolution: 'last-write-wins'
        },
        templates: {
            table: 'templates',
            columns: ['id', 'userId', 'name', 'category', 'subject', 'body', 'tone', 'usageCount', 'isDefault', 'createdAt', '_version', '_updatedAt', '_clientId', '_isDeleted'],
            // Include default templates (isDefault=true) plus user's own templates
            where: (userId: string) => sql`user_id = ${userId} OR is_default = true`,
            conflictResolution: 'last-write-wins'
        },
        reminders: {
            table: 'reminders',
            columns: ['id', 'userId', 'communicationId', 'dueDate', 'description', 'completed', 'completedAt', 'createdAt', '_version', '_updatedAt', '_clientId', '_isDeleted'],
            where: (userId: string) => sql`user_id = ${userId}`,
            conflictResolution: 'last-write-wins'
        },
        settings: {
            table: 'settings',
            columns: ['id', 'teacherName', 'schoolName', 'defaultLanguage', 'theme', 'updatedAt', '_version', '_updatedAt', '_clientId', '_isDeleted'],
            where: (userId: string) => sql`id = ${userId}`,
            conflictResolution: 'last-write-wins'
        }
    }
};
