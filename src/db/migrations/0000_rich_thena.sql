CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(190) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "reference_locales" (
	"reference_id" integer NOT NULL,
	"locale" varchar(5) NOT NULL,
	"title" varchar(200) NOT NULL,
	"summary" text,
	"body" text,
	"testimonial" text,
	"testimonial_author" varchar(160),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reference_locales_reference_id_locale_pk" PRIMARY KEY("reference_id","locale")
);
--> statement-breakpoint
CREATE TABLE "references" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"client_name" varchar(160) NOT NULL,
	"year" integer,
	"industry" varchar(60),
	"cover_image" varchar(255),
	"project_url" varchar(255),
	"tech" text[] DEFAULT '{}' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "references_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "reference_locales" ADD CONSTRAINT "reference_locales_reference_id_references_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."references"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "references_published_order_idx" ON "references" USING btree ("published","sort_order");