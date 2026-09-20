CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(190) NOT NULL,
	"company" varchar(190),
	"phone" varchar(40),
	"message" text NOT NULL,
	"locale" varchar(5),
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"handled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "role" varchar(20) DEFAULT 'editor' NOT NULL;--> statement-breakpoint
CREATE INDEX "contact_messages_status_created_idx" ON "contact_messages" USING btree ("status","created_at");