import { SyncEngine } from 'sveltekit-sync';
import { IndexedDBAdapter } from 'sveltekit-sync/adapters';
import { pushChanges, pullChanges } from '$lib/sync.remote';
import { browser } from '$app/environment';

// Create IndexedDB adapter
const adapter = new IndexedDBAdapter('classcomm-db', 1);

// Initialize sync engine
export const syncEngine = new SyncEngine({
  local: {
    db: null,
    adapter
  },
  remote: {
    push: (data) => pushChanges(data),
    pull: (lastSync: number, clientId: string) => pullChanges({ lastSync, clientId })
  },
  syncInterval: 30000, // Sync every 30 seconds
  conflictResolution: 'last-write-wins'
});

// Initialize database
export async function initDB() {
  if (!browser) return;

  await adapter.init({
    students: 'id',
    contacts: 'id',
    communications: 'id',
    templates: 'id',
    reminders: 'id',
    settings: 'id'
  });

  await syncEngine.init();
}

// Create collection stores for each table
export const studentsStore = syncEngine.collection('students');
export const contactsStore = syncEngine.collection('contacts');
export const communicationsStore = syncEngine.collection('communications');
export const templatesStore = syncEngine.collection('templates');
export const remindersStore = syncEngine.collection('reminders');
export const settingsStore = syncEngine.collection('settings');

// Type-safe interfaces
export interface Student {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  grade: string;
  class?: string;
  notes?: string;
  createdAt: number;
  _version: number;
  _updatedAt: number;
  _clientId?: string;
  _isDeleted?: boolean;
}

export interface Contact {
  id: string;
  userId: string;
  studentId: string;
  name: string;
  relationship: 'parent' | 'guardian' | 'emergency' | 'other';
  email?: string;
  phone?: string;
  preferredMethod?: 'email' | 'phone' | 'either';
  preferredLanguage: string;
  notes?: string;
  createdAt: number;
  _version: number;
  _updatedAt: number;
  _clientId?: string;
  _isDeleted?: boolean;
}

export interface Communication {
  id: string;
  userId: string;
  studentId: string;
  contactId?: string;
  subject: string;
  message: string;
  translatedMessage?: string;
  targetLanguage?: string;
  tone?: 'professional' | 'empathetic' | 'firm' | 'celebratory';
  status: 'draft' | 'sent' | 'scheduled';
  method?: 'email' | 'phone' | 'in-person' | 'note';
  scheduledFor?: number;
  sentAt?: number;
  templateId?: string;
  tags: string[];
  followUpDate?: number;
  followUpCompleted: boolean;
  createdAt: number;
  _version: number;
  _updatedAt: number;
  _clientId?: string;
  _isDeleted?: boolean;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  category: 'academic' | 'behavior' | 'attendance' | 'celebration' | 'concern' | 'general';
  subject: string;
  body: string;
  tone?: string;
  usageCount: number;
  isDefault: boolean;
  createdAt: number;
  _version: number;
  _updatedAt: number;
  _clientId?: string;
  _isDeleted?: boolean;
}

export interface Reminder {
  id: string;
  userId: string;
  communicationId: string;
  dueDate: number;
  description: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  _version: number;
  _updatedAt: number;
  _clientId?: string;
  _isDeleted?: boolean;
}
