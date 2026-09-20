CREATE TABLE "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" varchar(255) NOT NULL,
	"reference_id" integer,
	"locale" varchar(5) NOT NULL,
	"day" date NOT NULL,
	"source" varchar(120) DEFAULT 'direct' NOT NULL,
	"country" varchar(10) DEFAULT 'other' NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "page_views_unique" UNIQUE("path","locale","day","source","country")
);
--> statement-breakpoint
CREATE TABLE "slug_redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_slug" varchar(120) NOT NULL,
	"reference_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slug_redirects_from_slug_unique" UNIQUE("from_slug")
);
--> statement-breakpoint
ALTER TABLE "reference_locales" ADD COLUMN "meta_title" varchar(200);--> statement-breakpoint
ALTER TABLE "reference_locales" ADD COLUMN "meta_description" varchar(320);--> statement-breakpoint
ALTER TABLE "project_references" ADD COLUMN "noindex" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_reference_id_project_references_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."project_references"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slug_redirects" ADD CONSTRAINT "slug_redirects_reference_id_project_references_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."project_references"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_views_day_idx" ON "page_views" USING btree ("day");--> statement-breakpoint
CREATE INDEX "page_views_reference_idx" ON "page_views" USING btree ("reference_id","day");--> statement-breakpoint
CREATE INDEX "slug_redirects_from_idx" ON "slug_redirects" USING btree ("from_slug");