import { pgTable, text, boolean, timestamp, integer, uuid, jsonb } from 'drizzle-orm/pg-core';
import { syncMetadata } from 'sveltekit-sync/adapters/drizzle';

export { syncLog, clientState } from 'sveltekit-sync/adapters/drizzle';

//auth tables
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id)
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at")
});

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
