# ClassComm - AI-Powered Parent Communication Manager
## Development Prompt for GitHub Copilot (Using sveltekit-sync)

### Project Overview
Build ClassComm, a local-first desktop and mobile application for teachers to manage parent communications efficiently. The app uses SvelteKit + Tauri for cross-platform support, **sveltekit-sync for local-first data synchronization**, and integrates AI for drafting professional, empathetic messages.

---

## Tech Stack
- **Frontend Framework**: SvelteKit 2.x
- **Desktop/Mobile**: Tauri 2.x
- **Sync Engine**: sveltekit-sync (local-first with IndexedDB)
- **Server Database**: PostgreSQL + Drizzle ORM
- **UI Components**: shadcn-svelte
- **Styling**: TailwindCSS
- **AI Integration**: Gemini API (Google) - Abstracted Provider Pattern
- **Type Safety**: TypeScript throughout

---

## Database Schema (Drizzle ORM + sveltekit-sync)

### Important: All tables must include sync metadata

```typescript
// src/lib/server/database/schema.ts
import { pgTable, text, boolean, timestamp, integer, uuid, jsonb } from 'drizzle-orm/pg-core';
import { syncMetadata } from 'sveltekit-sync/adapters/drizzle';
export { syncLog, clientstate } from 'sveltekit-sync/adapters/drizzle';


export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Teacher ID for RLS
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  grade: text('grade').notNull(),
  class: text('class'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ...syncMetadata
});

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Teacher ID for RLS
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(), // 'parent' | 'guardian' | 'emergency' | 'other'
  email: text('email'),
  phone: text('phone'),
  preferredMethod: text('preferred_method'), // 'email' | 'phone' | 'either'
  preferredLanguage: text('preferred_language').default('en'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ...syncMetadata
});

export const communications = pgTable('communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Teacher ID for RLS
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  translatedMessage: text('translated_message'),
  targetLanguage: text('target_language'),
  tone: text('tone'), // 'professional' | 'empathetic' | 'firm' | 'celebratory'
  status: text('status').notNull().default('draft'), // 'draft' | 'sent' | 'scheduled'
  method: text('method'), // 'email' | 'phone' | 'in-person' | 'note'
  scheduledFor: timestamp('scheduled_for'),
  sentAt: timestamp('sent_at'),
  templateId: uuid('template_id').references(() => templates.id),
  tags: jsonb('tags').$type<string[]>().default([]),
  followUpDate: timestamp('follow_up_date'),
  followUpCompleted: boolean('follow_up_completed').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ...syncMetadata
});

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Teacher ID for RLS
  name: text('name').notNull(),
  category: text('category').notNull(), // 'academic' | 'behavior' | 'attendance' | 'celebration' | 'concern' | 'general'
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  tone: text('tone'),
  usageCount: integer('usage_count').default(0),
  isDefault: boolean('is_default').default(false), // System templates
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ...syncMetadata
});

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Teacher ID for RLS
  communicationId: uuid('communication_id').notNull().references(() => communications.id, { onDelete: 'cascade' }),
  dueDate: timestamp('due_date').notNull(),
  description: text('description').notNull(),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ...syncMetadata
});

export const settings = pgTable('settings', {
  id: text('id').primaryKey(), // userId
  teacherName: text('teacher_name').notNull(),
  schoolName: text('school_name'),
  defaultLanguage: text('default_language').default('en'),
  theme: text('theme').default('system'), // 'light' | 'dark' | 'system'
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ...syncMetadata
});

```

---

## Sync Configuration

### Server Sync Schema

```typescript
// src/lib/server/sync-schema.ts
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
```

### Remote Functions (SvelteKit Remote Functions API)

```typescript
// src/lib/sync.remote.ts
import { query, command } from '$app/server';
import * as v from 'valibot';
import { ServerSyncEngine } from 'sveltekit-sync/server';
import { db } from '$lib/server/database';
import { syncSchema } from '$lib/server/sync-schema';
import { auth } from '$lib/auth'; // better-auth instance

// Initialize server sync engine
const serverSync = new ServerSyncEngine(db, syncSchema);

// Schema for sync operations
const SyncOperationSchema = v.object({
  id: v.string(),
  table: v.string(),
  operation: v.picklist(['insert', 'update', 'delete']),
  data: v.optional(v.any()),
  timestamp: v.number(),
  clientId: v.string()
});

// Push local changes to server
export const pushChanges = command(
  v.array(SyncOperationSchema),
  async (operations, { request }) => {
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
  async ({ lastSync, clientId }, { request }) => {
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
```

---

## Client Setup

### Initialize Sync Engine

```typescript
// src/lib/db.ts
import { SyncEngine, IndexedDBAdapter } from 'sveltekit-sync';
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
```

---

## Application Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── database/
│   │   │   ├── schema.ts              # Drizzle schema with sync metadata
│   │   │   └── index.ts               # Database connection
│   │   └── sync-schema.ts             # sveltekit-sync configuration
│   ├── ai/
│   │   ├── types.ts                   # AI Provider interfaces
│   │   ├── gemini.ts                  # Gemini implementation
│   │   ├── factory.ts                 # AI Provider Factory
│   │   └── prompts.ts                 # System prompts
│   ├── utils/
│   │   ├── export.ts                  # CSV/PDF export
│   │   ├── variables.ts               # Template variable replacement
│   │   └── dates.ts                   # Date formatting helpers
│   ├── components/
│   │   ├── ui/                        # shadcn-svelte components
│   │   ├── StudentCard.svelte
│   │   ├── CommunicationTimeline.svelte
│   │   ├── TemplateSelector.svelte
│   │   ├── AIComposer.svelte
│   │   └── ReminderWidget.svelte
│   ├── db.ts                          # Sync engine initialization
│   └── sync.remote.ts                 # Remote functions
├── routes/
│   ├── +layout.svelte                 # Root layout with sync init
│   ├── +page.svelte                   # Dashboard
│   ├── students/
│   │   ├── +page.svelte               # Student list
│   │   ├── [id]/+page.svelte          # Student detail
│   │   └── new/+page.svelte           # Add student
│   ├── compose/
│   │   ├── +page.svelte               # New communication
│   │   └── [id]/+page.svelte          # Edit draft
│   ├── templates/
│   │   └── +page.svelte               # Template library
│   ├── reminders/
│   │   └── +page.svelte               # Reminders dashboard
│   └── settings/
│       └── +page.svelte               # App settings
└── src-tauri/
    ├── src/
    │   └── main.rs                    # Tauri commands
    └── tauri.conf.json
```

---

## Implementation Guide

### Phase 1: Setup & Core CRUD (Day 1)

1. **Initialize Project**
```bash
pnpx sv@latest create classcomm
cd classcomm
pnpm install
pnpm install -D @sveltejs/adapter-static
pnpm install sveltekit-sync
pnpm install drizzle-orm postgres
pnpm install -D drizzle-kit
pnpm install @google/generative-ai
pnpm install better-auth
```

2. **Setup Tauri**
```bash
pnpm install -D @tauri-apps/cli
pnpx tauri init
```

3. **Create Database Schema** (see schema above)

4. **Initialize Sync Engine** (see client setup above)

5. **Create Root Layout**
```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { initDB, syncEngine } from '$lib/db';
  import { browser } from '$app/environment';
  import '../app.css';

  onMount(async () => {
    if (browser) {
      await initDB();
    }
    return () => syncEngine.destroy();
  });

  const syncState = $derived(syncEngine.state);
</script>

<div class="app">
  <header>
    <h1>ClassComm</h1>
    {#if syncState.isSyncing}
      <div class="sync-indicator">Syncing...</div>
    {/if}
  </header>
  
  <main>
    <slot />
  </main>
</div>
```

### Phase 2: Student Management (Day 1-2)

**Student List Page**:
```svelte
<!-- src/routes/students/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { studentsStore, type Student } from '$lib/db';
  import { goto } from '$app/navigation';

  let searchQuery = $state('');

  onMount(() => studentsStore.load());

  const filteredStudents = $derived(
    studentsStore.data.filter((s: Student) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  async function addStudent() {
    goto('/students/new');
  }
</script>

<div class="students-page">
  <div class="header">
    <h1>Students</h1>
    <button onclick={addStudent}>Add Student</button>
  </div>

  <input 
    type="search" 
    bind:value={searchQuery} 
    placeholder="Search students..."
  />

  <div class="student-list">
    {#each filteredStudents as student (student.id)}
      <a href="/students/{student.id}" class="student-card">
        <h3>{student.firstName} {student.lastName}</h3>
        <p>Grade {student.grade} {student.class ? `• ${student.class}` : ''}</p>
      </a>
    {/each}
  </div>
</div>
```

**Add Student Form**:
```svelte
<!-- src/routes/students/new/+page.svelte -->
<script lang="ts">
  import { studentsStore } from '$lib/db';
  import { goto } from '$app/navigation';

  let form = $state({
    firstName: '',
    lastName: '',
    grade: '',
    class: '',
    notes: ''
  });

  async function handleSubmit() {
    await studentsStore.create({
      ...form,
      userId: 'current-user-id', // Get from auth
      createdAt: Date.now()
    });
    goto('/students');
  }
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  <h1>Add Student</h1>
  
  <label>
    First Name
    <input type="text" bind:value={form.firstName} required />
  </label>

  <label>
    Last Name
    <input type="text" bind:value={form.lastName} required />
  </label>

  <label>
    Grade
    <select bind:value={form.grade} required>
      <option value="">Select grade</option>
      <option value="K">Kindergarten</option>
      {#each Array.from({ length: 12 }, (_, i) => i + 1) as grade}
        <option value={grade}>{grade}</option>
      {/each}
    </select>
  </label>

  <label>
    Class
    <input type="text" bind:value={form.class} />
  </label>

  <label>
    Notes
    <textarea bind:value={form.notes}></textarea>
  </label>

  <button type="submit">Save Student</button>
</form>
```

### Phase 3: AI Message Drafting (Day 2)

**AI Composer Component**:
```svelte
<!-- src/lib/components/AIComposer.svelte -->
<script lang="ts">
  import { getAIProvider } from '$lib/ai/factory';
  import type { MessageParams } from '$lib/ai/types';
  import type { Student, Contact } from '$lib/db';

  interface Props {
    student: Student;
    contact: Contact;
    onComplete: (message: { subject: string; body: string }) => void;
  }

  let { student, contact, onComplete }: Props = $props();

  let scenario = $state('');
  let tone = $state<'professional' | 'empathetic' | 'firm' | 'celebratory'>('professional');
  let method = $state<'email' | 'phone' | 'note'>('email');
  let generatedMessage = $state<{ subject: string; body: string } | null>(null);
  let isGenerating = $state(false);
  let error = $state('');

  async function generate() {
    if (!scenario.trim()) return;

    isGenerating = true;
    error = '';

    try {
      const params: MessageParams = {
        scenario,
        tone,
        method,
        studentName: student.firstName,
        grade: student.grade,
        contactName: contact.name,
        additionalContext: student.notes
      };

      const provider = getAIProvider(); // Defaults to Gemini
      generatedMessage = await provider.generateMessage(params);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to generate message';
    } finally {
      isGenerating = false;
    }
  }

  function useMessage() {
    if (generatedMessage) {
      onComplete(generatedMessage);
    }
  }
</script>

<div class="ai-composer">
  <h3>AI Message Drafting</h3>

  <label>
    Describe the situation
    <textarea 
      bind:value={scenario}
      placeholder="Example: Student hasn't turned in homework for 2 weeks, need to discuss support strategies"
      rows="4"
    ></textarea>
  </label>

  <div class="controls">
    <label>
      Tone
      <select bind:value={tone}>
        <option value="professional">Professional</option>
        <option value="empathetic">Empathetic</option>
        <option value="firm">Firm</option>
        <option value="celebratory">Celebratory</option>
      </select>
    </label>

    <label>
      Method
      <select bind:value={method}>
        <option value="email">Email</option>
        <option value="phone">Phone Script</option>
        <option value="note">Written Note</option>
      </select>
    </label>
  </div>

  <button onclick={generate} disabled={isGenerating || !scenario.trim()}>
    {isGenerating ? 'Generating...' : 'Generate Message'}
  </button>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if generatedMessage}
    <div class="generated-message">
      <h4>Subject:</h4>
      <p>{generatedMessage.subject}</p>

      <h4>Message:</h4>
      <pre>{generatedMessage.body}</pre>

      <div class="actions">
        <button onclick={useMessage}>Use This Message</button>
        <button onclick={generate}>Regenerate</button>
      </div>
    </div>
  {/if}
</div>
```

**AI Service Abstraction & Gemini Integration**:
```typescript
// src/lib/ai/types.ts
export interface MessageParams {
  scenario: string;
  tone: 'professional' | 'empathetic' | 'firm' | 'celebratory';
  method: 'email' | 'phone' | 'note';
  studentName: string;
  grade: string;
  contactName: string;
  additionalContext?: string;
}

export interface AIProvider {
  generateMessage(params: MessageParams): Promise<{ subject: string; body: string }>;
  // translateMessage(message: string, targetLanguage: string): Promise<string>;
}
```

```typescript
// src/lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, MessageParams } from './types';

export class GeminiProvider implements AIProvider {
  private model;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  async generateMessage(params: MessageParams): Promise<{ subject: string; body: string }> {
    const systemPrompt = `You are an expert educational communication assistant helping teachers draft professional, empathetic messages to parents and guardians.

Guidelines:
1. Be specific about the issue or update
2. Start with something positive when possible
3. Use "I" statements (I've noticed, I'm concerned)
4. Offer concrete next steps or solutions
5. Invite collaboration
6. Keep it concise (150-250 words for emails)
7. End with appreciation for partnership
8. Avoid educational jargon
9. Be culturally sensitive
10. Maintain professional boundaries`;
    
    const userPrompt = `Generate a ${params.method} to ${params.contactName} regarding ${params.studentName} (Grade ${params.grade}) with the following situation:

${params.scenario}

${params.additionalContext ? `Additional context: ${params.additionalContext}` : ''}

Tone: ${params.tone}

Provide:
1. Subject line (if email)
2. Message body

Format your response as JSON:
{
  "subject": "...",
  "body": "..."
}`;

    const result = await this.model.generateContent([
      { text: systemPrompt }, // Gemini 2.5 Pro supports system instructions, or prepend to prompt
      { text: userPrompt }
    ]);
    
    const response = result.response;
    const text = response.text();
    
    // Parse JSON from text (Gemini might return markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse message from response');
    }

    return JSON.parse(jsonMatch[0]);
  }
}
```

```typescript
// src/lib/ai/factory.ts
import { GeminiProvider } from './gemini';
import type { AIProvider } from './types';

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    // In a real app, you might load this from settings or env
    // For now, default to Gemini
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'demo-key';
    providerInstance = new GeminiProvider(apiKey);
  }
  return providerInstance;
}

export function setAIProvider(provider: AIProvider) {
  providerInstance = provider;
}
```

### Phase 4: Communication History & Timeline (Day 2-3)

```svelte
<!-- src/lib/components/CommunicationTimeline.svelte -->
<script lang="ts">
  import { communicationsStore, contactsStore, type Communication } from '$lib/db';
  import { format } from 'date-fns';

  interface Props {
    studentId: string;
  }

  let { studentId }: Props = $props();

  const studentCommunications = $derived(
    communicationsStore.data
      .filter((c: Communication) => c.studentId === studentId && !c._isDeleted)
      .sort((a: Communication, b: Communication) => b.createdAt - a.createdAt)
  );

  function getContactName(contactId?: string) {
    if (!contactId) return 'Unknown';
    const contact = contactsStore.data.find(c => c.id === contactId);
    return contact?.name || 'Unknown';
  }

  function getStatusColor(status: string) {
    return {
      draft: 'text-amber-600',
      sent: 'text-green-600',
      scheduled: 'text-blue-600'
    }[status] || 'text-gray-600';
  }
</script>

<div class="timeline">
  <h3>Communication History</h3>

  {#if studentCommunications.length === 0}
    <p class="empty-state">No communications yet</p>
  {:else}
    {#each studentCommunications as comm (comm.id)}
      <div class="timeline-item">
        <div class="timeline-date">
          {format(comm.createdAt, 'MMM d, yyyy')}
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <h4>{comm.subject}</h4>
            <span class={getStatusColor(comm.status)}>
              {comm.status}
            </span>
          </div>
          <p class="contact-info">
            To: {getContactName(comm.contactId)} • {comm.method || 'email'}
          </p>
          {#if comm.tags.length > 0}
            <div class="tags">
              {#each comm.tags as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>
          {/if}
          <p class="message-preview">{comm.message.substring(0, 100)}...</p>
          <div class="timeline-actions">
            <button onclick={() => window.location.href = `/compose/${comm.id}`}>View</button>
            {#if comm.status === 'draft'}
              <button onclick={() => window.location.href = `/compose/${comm.id}`}>Edit</button>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .timeline {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .timeline-item {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 1rem;
    padding: 1rem;
    border-left: 2px solid #e5e7eb;
  }

  .timeline-date {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .timeline-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tag {
    background: #e5e7eb;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }

  .message-preview {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .timeline-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
</style>
```

### Phase 5: Templates & Variables (Day 3)

**Template Library Page**:
```svelte
<!-- src/routes/templates/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { templatesStore, type Template } from '$lib/db';
  import { replaceVariables } from '$lib/utils/variables';
  import { goto } from '$app/navigation';

  let selectedCategory = $state<string>('all');
  let searchQuery = $state('');
  let previewTemplate = $state<Template | null>(null);

  onMount(() => templatesStore.load());

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'academic', label: 'Academic' },
    { value: 'behavior', label: 'Behavior' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'celebration', label: 'Celebration' },
    { value: 'concern', label: 'Concern' },
    { value: 'general', label: 'General' }
  ];

  const filteredTemplates = $derived(
    templatesStore.data.filter((t: Template) => {
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && !t._isDeleted;
    }).sort((a: Template, b: Template) => b.usageCount - a.usageCount)
  );

  async function useTemplate(template: Template) {
    // Increment usage count
    await templatesStore.update(template.id, {
      usageCount: template.usageCount + 1
    });
    
    // Navigate to compose with template
    goto(`/compose?templateId=${template.id}`);
  }

  async function deleteTemplate(template: Template) {
    if (template.isDefault) {
      alert('Cannot delete default templates');
      return;
    }
    
    if (confirm(`Delete template "${template.name}"?`)) {
      await templatesStore.delete(template.id);
    }
  }
</script>

<div class="templates-page">
  <div class="header">
    <h1>Template Library</h1>
    <button onclick={() => goto('/templates/new')}>Create Template</button>
  </div>

  <div class="filters">
    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Search templates..."
    />

    <select bind:value={selectedCategory}>
      {#each categories as category}
        <option value={category.value}>{category.label}</option>
      {/each}
    </select>
  </div>

  <div class="template-grid">
    {#each filteredTemplates as template (template.id)}
      <div class="template-card">
        <div class="template-header">
          <div>
            <h3>{template.name}</h3>
            <span class="category-badge">{template.category}</span>
          </div>
          {#if template.usageCount > 0}
            <span class="usage-badge">Used {template.usageCount}x</span>
          {/if}
        </div>

        <p class="template-subject"><strong>Subject:</strong> {template.subject}</p>
        <p class="template-body">{template.body.substring(0, 150)}...</p>

        <div class="template-actions">
          <button onclick={() => previewTemplate = template}>Preview</button>
          <button onclick={() => useTemplate(template)}>Use Template</button>
          {#if !template.isDefault}
            <button class="danger" onclick={() => deleteTemplate(template)}>Delete</button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

{#if previewTemplate}
  <div class="modal-overlay" onclick={() => previewTemplate = null}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h2>{previewTemplate.name}</h2>
      <div class="modal-content">
        <p><strong>Category:</strong> {previewTemplate.category}</p>
        <p><strong>Subject:</strong> {previewTemplate.subject}</p>
        <h4>Message Body:</h4>
        <pre>{previewTemplate.body}</pre>
        <p class="note">Variables like {{studentName}}, {{grade}}, {{teacherName}} will be replaced with actual values</p>
      </div>
      <div class="modal-actions">
        <button onclick={() => useTemplate(previewTemplate!)}>Use Template</button>
        <button onclick={() => previewTemplate = null}>Close</button>
      </div>
    </div>
  </div>
{/if}
```

**Variable Replacement Utility**:
```typescript
// src/lib/utils/variables.ts
import type { Student, Contact } from '$lib/db';

export interface VariableContext {
  student?: Student;
  contact?: Contact;
  teacherName: string;
  schoolName: string;
}

export function replaceVariables(text: string, context: VariableContext): string {
  let result = text;

  // Student variables
  if (context.student) {
    result = result
      .replace(/\{\{studentName\}\}/g, context.student.firstName)
      .replace(/\{\{studentFullName\}\}/g, `${context.student.firstName} ${context.student.lastName}`)
      .replace(/\{\{grade\}\}/g, context.student.grade)
      .replace(/\{\{class\}\}/g, context.student.class || '');
  }

  // Contact variables
  if (context.contact) {
    result = result
      .replace(/\{\{parentName\}\}/g, context.contact.name)
      .replace(/\{\{contactName\}\}/g, context.contact.name);
  }

  // Teacher/School variables
  result = result
    .replace(/\{\{teacherName\}\}/g, context.teacherName)
    .replace(/\{\{schoolName\}\}/g, context.schoolName)
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
    .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());

  return result;
}

export function getAvailableVariables(): string[] {
  return [
    '{{studentName}}',
    '{{studentFullName}}',
    '{{grade}}',
    '{{class}}',
    '{{parentName}}',
    '{{contactName}}',
    '{{teacherName}}',
    '{{schoolName}}',
    '{{date}}',
    '{{time}}'
  ];
}
```

### Phase 6: Reminders & Dashboard (Day 3-4)

**Reminder Widget Component**:
```svelte
<!-- src/lib/components/ReminderWidget.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { remindersStore, communicationsStore, studentsStore } from '$lib/db';
  import type { Reminder } from '$lib/db';
  import { format, isPast, isToday, isTomorrow } from 'date-fns';

  onMount(() => {
    remindersStore.load();
  });

  const upcomingReminders = $derived(
    remindersStore.data
      .filter((r: Reminder) => !r.completed && !r._isDeleted)
      .sort((a: Reminder, b: Reminder) => a.dueDate - b.dueDate)
      .slice(0, 5)
  );

  function getDateLabel(timestamp: number): string {
    if (isPast(timestamp)) return 'OVERDUE';
    if (isToday(timestamp)) return 'TODAY';
    if (isTomorrow(timestamp)) return 'TOMORROW';
    return format(timestamp, 'MMM d');
  }

  function getDateClass(timestamp: number): string {
    if (isPast(timestamp)) return 'overdue';
    if (isToday(timestamp)) return 'today';
    return 'upcoming';
  }

  async function completeReminder(reminder: Reminder) {
    await remindersStore.update(reminder.id, {
      completed: true,
      completedAt: Date.now()
    });
  }

  async function snoozeReminder(reminder: Reminder, days: number) {
    const newDueDate = Date.now() + (days * 24 * 60 * 60 * 1000);
    await remindersStore.update(reminder.id, {
      dueDate: newDueDate
    });
  }

  function getStudentName(commId: string): string {
    const comm = communicationsStore.data.find(c => c.id === commId);
    if (!comm) return 'Unknown';
    const student = studentsStore.data.find(s => s.id === comm.studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown';
  }
</script>

<div class="reminder-widget">
  <h3>Upcoming Reminders</h3>

  {#if upcomingReminders.length === 0}
    <p class="empty-state">No upcoming reminders</p>
  {:else}
    <div class="reminder-list">
      {#each upcomingReminders as reminder (reminder.id)}
        <div class="reminder-item">
          <div class="reminder-date {getDateClass(reminder.dueDate)}">
            {getDateLabel(reminder.dueDate)}
          </div>
          <div class="reminder-content">
            <p class="reminder-description">{reminder.description}</p>
            <p class="reminder-student">{getStudentName(reminder.communicationId)}</p>
            <div class="reminder-actions">
              <button class="btn-sm" onclick={() => completeReminder(reminder)}>
                Complete
              </button>
              <button class="btn-sm" onclick={() => snoozeReminder(reminder, 1)}>
                Snooze 1d
              </button>
              <button class="btn-sm" onclick={() => snoozeReminder(reminder, 7)}>
                Snooze 1w
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .reminder-widget {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .reminder-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .reminder-item {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.375rem;
  }

  .reminder-date {
    font-weight: 600;
    font-size: 0.875rem;
    text-align: center;
    padding: 0.5rem;
    border-radius: 0.25rem;
  }

  .reminder-date.overdue {
    background: #fee;
    color: #dc2626;
  }

  .reminder-date.today {
    background: #fef3c7;
    color: #d97706;
  }

  .reminder-date.upcoming {
    background: #dbeafe;
    color: #2563eb;
  }

  .reminder-description {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .reminder-student {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .reminder-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
</style>
```

**Dashboard Page**:
```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    studentsStore, 
    communicationsStore, 
    remindersStore,
    settingsStore 
  } from '$lib/db';
  import ReminderWidget from '$lib/components/ReminderWidget.svelte';
  import { startOfWeek, startOfMonth } from 'date-fns';

  onMount(() => {
    studentsStore.load();
    communicationsStore.load();
    remindersStore.load();
    settingsStore.load();
  });

  const stats = $derived({
    totalStudents: studentsStore.data.filter(s => !s._isDeleted).length,
    thisWeek: communicationsStore.data.filter(c => 
      c.createdAt >= startOfWeek(new Date()).getTime() && !c._isDeleted
    ).length,
    drafts: communicationsStore.data.filter(c => 
      c.status === 'draft' && !c._isDeleted
    ).length,
    pendingReminders: remindersStore.data.filter(r => 
      !r.completed && !r._isDeleted
    ).length
  });

  const recentCommunications = $derived(
    communicationsStore.data
      .filter(c => !c._isDeleted)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
  );

  const studentsNeedingOutreach = $derived(
    studentsStore.data.filter(student => {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const hasRecentComm = communicationsStore.data.some(c => 
        c.studentId === student.id && 
        c.createdAt > thirtyDaysAgo &&
        !c._isDeleted
      );
      return !hasRecentComm && !student._isDeleted;
    }).slice(0, 5)
  );

  function getStudentName(studentId: string): string {
    const student = studentsStore.data.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown';
  }
</script>

<div class="dashboard">
  <div class="welcome">
    <h1>Welcome back, {settingsStore.data[0]?.teacherName || 'Teacher'}!</h1>
    <p>Here's what's happening with your students</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">{stats.totalStudents}</div>
      <div class="stat-label">Total Students</div>
    </div>

    <div class="stat-card">
      <div class="stat-value">{stats.thisWeek}</div>
      <div class="stat-label">Messages This Week</div>
    </div>

    <div class="stat-card">
      <div class="stat-value">{stats.drafts}</div>
      <div class="stat-label">Draft Messages</div>
    </div>

    <div class="stat-card">
      <div class="stat-value">{stats.pendingReminders}</div>
      <div class="stat-label">Pending Reminders</div>
    </div>
  </div>

  <div class="dashboard-grid">
    <div class="dashboard-section">
      <ReminderWidget />
    </div>

    <div class="dashboard-section">
      <div class="card">
        <h3>Recent Communications</h3>
        {#if recentCommunications.length === 0}
          <p class="empty-state">No recent communications</p>
        {:else}
          <div class="comm-list">
            {#each recentCommunications as comm (comm.id)}
              <a href="/compose/{comm.id}" class="comm-item">
                <div>
                  <p class="comm-subject">{comm.subject}</p>
                  <p class="comm-meta">
                    {getStudentName(comm.studentId)} • 
                    <span class="status-{comm.status}">{comm.status}</span>
                  </p>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="dashboard-section">
      <div class="card">
        <h3>Students Needing Outreach</h3>
        <p class="card-subtitle">No contact in 30+ days</p>
        {#if studentsNeedingOutreach.length === 0}
          <p class="empty-state">All students contacted recently! 🎉</p>
        {:else}
          <div class="student-list">
            {#each studentsNeedingOutreach as student (student.id)}
              <a href="/students/{student.id}" class="student-item">
                <span>{student.firstName} {student.lastName}</span>
                <span class="grade">Grade {student.grade}</span>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="quick-actions">
    <h3>Quick Actions</h3>
    <div class="action-buttons">
      <a href="/compose" class="btn btn-primary">+ New Message</a>
      <a href="/students" class="btn">View Students</a>
      <a href="/templates" class="btn">Browse Templates</a>
      <a href="/reminders" class="btn">All Reminders</a>
    </div>
  </div>
</div>

<style>
  .dashboard {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .welcome {
    margin-bottom: 2rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #2563eb;
  }

  .stat-label {
    color: #6b7280;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .card {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .quick-actions {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }
</style>
```

---

## Tauri Configuration

### Tauri Commands for Native Features

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use notify_rust::Notification;

#[tauri::command]
fn show_notification(title: String, body: String) -> Result<(), String> {
    Notification::new()
        .summary(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn export_pdf(content: String, filename: String) -> Result<String, String> {
    // Implement PDF generation using a library like printpdf
    // This is a placeholder
    Ok(format!("PDF exported to {}", filename))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            show_notification,
            export_pdf
        ])
        .setup(|app| {
            // Setup notification system for reminders
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Tauri Config

```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../build"
  },
  "package": {
    "productName": "ClassComm",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "writeFile": true,
        "readFile": true,
        "scope": ["$DOWNLOAD/*"]
      },
      "notification": {
        "all": true
      },
      "dialog": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "identifier": "com.classcomm.app",
      "icon": [
        "icons/icon.png"
      ],
      "targets": "all"
    },
    "windows": [
      {
        "title": "ClassComm",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

---

## Key Implementation Tips

### 1. Leverage sveltekit-sync Benefits
- All CRUD operations automatically sync in background
- Optimistic updates make UI feel instant
- Offline-first means app works without internet
- Delta sync only sends changes (efficient)

### 2. Use Svelte 5 Runes Properly
```typescript
// State
let count = $state(0);

// Derived values
const doubled = $derived(count * 2);

// Effects
$effect(() => {
  console.log('Count changed:', count);
});
```

### 3. Handle Sync Conflicts Gracefully
```typescript
syncEngine.onConflict = (conflict) => {
  // Log for debugging
  console.warn('Sync conflict:', conflict);
  
  // Use last-write-wins by default
  return conflict.serverVersion;
};
```

### 4. Seed Default Templates on First Run
```typescript
// src/lib/db.ts
export async function seedDefaultTemplates(userId: string) {
  const existing = await templatesStore.data;
  if (existing.some(t => t.isDefault)) return; // Already seeded

  const defaultTemplates = [
    {
      name: 'Homework Missing',
      category: 'academic',
      subject: 'Homework Update for {{studentName}}',
      body: `Dear {{parentName}},\n\nI'm reaching out regarding {{studentName}}'s homework completion...`,
      isDefault: true,
      userId: 'system'
    },
    // Add 10-15 more default templates
  ];

  for (const template of defaultTemplates) {
    await templatesStore.create(template);
  }
}
```

### 5. Implement Proper Error Boundaries
```svelte
<!-- src/lib/components/ErrorBoundary.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  let error = $state<Error | null>(null);

  onMount(() => {
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  });

  function handleError(event: ErrorEvent) {
    error = event.error;
  }

  function handleRejection(event: PromiseRejectionEvent) {
    error = new Error(event.reason);
  }
</script>

{#if error}
  <div class="error-boundary">
    <h2>Something went wrong</h2>
    <p>{error.message}</p>
    <button onclick={() => window.location.reload()}>Reload App</button>
  </div>
{:else}
  <slot />
{/if}
```

---

## Testing Strategy

### Unit Tests (Vitest)
```typescript
// src/lib/utils/variables.test.ts
import { describe, it, expect } from 'vitest';
import { replaceVariables } from './variables';

describe('replaceVariables', () => {
  it('replaces student variables', () => {
    const result = replaceVariables(
      'Hello {{studentName}} from Grade {{grade}}',
      {
        student: {
          firstName: 'John',
          grade: '5'
        },
        teacherName: 'Ms. Smith',
        schoolName: 'Lincoln Elementary'
      }
    );

    expect(result).toBe('Hello John from Grade 5');
  });
});
```

### Integration Tests
```typescript
// Test sync engine operations
import { describe, it, expect, beforeEach } from 'vitest';
import { syncEngine, studentsStore } from '$lib/db';

describe('Student CRUD', () => {
  beforeEach(async () => {
    await syncEngine.init();
  });

  it('creates student optimistically', async () => {
    const student = {
      firstName: 'Jane',
      lastName: 'Doe',
      grade: '3',
      userId: 'test-user'
    };

    await studentsStore.create(student);
    
    // Should be in store immediately
    expect(studentsStore.data.some(s => s.firstName === 'Jane')).toBe(true);
  });
});
```

---

## Demo Video Script

### Opening (15 seconds)
"Teachers spend 10+ hours weekly writing parent emails. What if AI could help?"

### Problem (30 seconds)
Show teacher overwhelmed with inbox, struggling to write diplomatic message

### Solution Demo (2 minutes)
1. Open ClassComm
2. Select student "Sarah Johnson"
3. Click "New Message"
4. Type scenario: "Student hasn't turned in homework for 2 weeks"
5. AI generates professional message in 3 seconds
6. Adjust tone to "more empathetic"
7. Translate to Spanish with one click
8. Save draft, set reminder for 1 week
9. Show it syncing in status bar
10. Close app, reopen - data still there (offline-first!)

### Impact (30 seconds)
- "Draft in 30 seconds instead of 30 minutes"
- "Multi-language support for diverse families"
- "Complete privacy - data never leaves your device"
- "Works offline - grade on the go"

### Call to Action (15 seconds)
"ClassComm: AI-powered parent communication for modern teachers"

---

## Deployment Checklist

- [ ] Set up PostgreSQL database
- [ ] Deploy SvelteKit backend (Vercel/Cloudflare/self-hosted)
- [ ] Configure environment variables (API keys)
- [ ] Build Tauri desktop apps (Windows, Mac, Linux)
- [ ] Test offline functionality
- [ ] Test sync across multiple devices
- [ ] Seed default templates
- [ ] Create demo video
- [ ] Write documentation
- [ ] Submit to Devpost

---

## Success Criteria

**Impact (5/5)**
- Saves 5-10 hours/week per teacher
- Supports diverse families with multi-language
- Privacy-first protects student data

**Innovation (5/5)**
- Local-first architecture (rare in ed-tech)
- AI message drafting with tone control
- Seamless offline/online experience

**Execution (5/5)**
- Polished UI with shadcn-svelte
- Smooth animations and transitions
- Working demo with real scenarios
- Comprehensive feature set

**Learning (5/5)**
- Interview teachers for real pain points
- Document design decisions
- Explain technical architecture
- Show iteration process

**Presentation (5/5)**
- Clear problem → solution narrative
- Live demo showing key features
- Measurable impact (time saved)
- Professional video production

---

Good luck with the hackathon! Focus on getting the core loop working: add student → compose message with AI → save → view history. Everything else is bonus. The local-first architecture with sveltekit-sync is your secret weapon - emphasize it!