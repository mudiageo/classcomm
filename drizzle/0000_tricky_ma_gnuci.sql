CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_sync_client_state" (
	"client_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"last_sync" timestamp DEFAULT now() NOT NULL,
	"last_active" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"student_id" uuid NOT NULL,
	"contact_id" uuid,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"translated_message" text,
	"target_language" text,
	"tone" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"method" text,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"template_id" uuid,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"follow_up_date" timestamp,
	"follow_up_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"_version" integer DEFAULT 1 NOT NULL,
	"_updated_at" timestamp DEFAULT now() NOT NULL,
	"_client_id" text,
	"_is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"student_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"email" text,
	"phone" text,
	"preferred_method" text,
	"preferred_language" text DEFAULT 'en',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"_version" integer DEFAULT 1 NOT NULL,
	"_updated_at" timestamp DEFAULT now() NOT NULL,
	"_client_id" text,
	"_is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"communication_id" uuid NOT NULL,
	"due_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"_version" integer DEFAULT 1 NOT NULL,
	"_updated_at" timestamp DEFAULT now() NOT NULL,
	"_client_id" text,
	"_is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_name" text NOT NULL,
	"school_name" text,
	"default_language" text DEFAULT 'en',
	"theme" text DEFAULT 'system',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"_version" integer DEFAULT 1 NOT NULL,
	"_updated_at" timestamp DEFAULT now() NOT NULL,
	"_client_id" text,
	"_is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"grade" text NOT NULL,
	"class" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"_version" integer DEFAULT 1 NOT NULL,
	"_updated_at" timestamp DEFAULT now() NOT NULL,
	"_client_id" text,
	"_is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" text NOT NULL,
	"record_id" text NOT NULL,
	"operation" text NOT NULL,
	"data" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"client_id" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"tone" text,
	"usage_count" integer DEFAULT 0,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"_version" integer DEFAULT 1 NOT NULL,
	"_updated_at" timestamp DEFAULT now() NOT NULL,
	"_client_id" text,
	"_is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_communication_id_communications_id_fk" FOREIGN KEY ("communication_id") REFERENCES "public"."communications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;