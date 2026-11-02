CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('NEW', 'IN_PROGRESS', 'ENROLLED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."appointment_kind" AS ENUM('LEADERSHIP', 'DEAN', 'TEACHER', 'SPECIALIST');--> statement-breakpoint
CREATE TYPE "public"."menu_item_kind" AS ENUM('GROUP', 'SECTION', 'PAGE', 'URL');--> statement-breakpoint
CREATE TYPE "public"."menu_location" AS ENUM('HEADER', 'FOOTER');--> statement-breakpoint
CREATE TYPE "public"."office_kind" AS ENUM('DEPARTMENT', 'DIVISION', 'OFFICE', 'CENTER');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'EDITOR');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"degree_id" uuid,
	"program_id" uuid,
	"message" text,
	"locale" text NOT NULL,
	"status" "application_status" DEFAULT 'NEW' NOT NULL,
	"notes" text,
	"consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"kind" "appointment_kind" NOT NULL,
	"position" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"faculty_id" uuid,
	"department_id" uuid,
	"office_id" uuid,
	"is_head" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "appointments_target_check" CHECK (("appointments"."kind" = 'TEACHER' AND "appointments"."department_id" IS NOT NULL AND "appointments"."office_id" IS NULL AND "appointments"."faculty_id" IS NULL)
       OR ("appointments"."kind" = 'SPECIALIST' AND "appointments"."office_id" IS NOT NULL AND "appointments"."department_id" IS NULL AND "appointments"."faculty_id" IS NULL)
       OR ("appointments"."kind" = 'DEAN' AND "appointments"."faculty_id" IS NOT NULL AND "appointments"."department_id" IS NULL AND "appointments"."office_id" IS NULL)
       OR ("appointments"."kind" = 'LEADERSHIP' AND "appointments"."faculty_id" IS NULL AND "appointments"."department_id" IS NULL AND "appointments"."office_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "degrees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"awarded" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"duration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_id" uuid,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "degrees_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"faculty_id" uuid NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_id" uuid,
	"phone" text,
	"email" text,
	"location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_id" uuid,
	"faculty_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"registration_url" text,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faculties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_id" uuid,
	"phone" text,
	"email" text,
	"location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faculties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" uuid,
	"name" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"title" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"uploaded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_files_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "media_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"is_public" boolean DEFAULT true NOT NULL,
	"listed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location" "menu_location" DEFAULT 'HEADER' NOT NULL,
	"parent_id" uuid,
	"kind" "menu_item_kind" DEFAULT 'SECTION' NOT NULL,
	"label" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"section_key" text,
	"page_id" uuid,
	"url" text,
	"open_in_new_tab" boolean DEFAULT false NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_id" uuid,
	"faculty_id" uuid,
	"featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"kind" "office_kind" DEFAULT 'OFFICE' NOT NULL,
	"parent_id" uuid,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_id" uuid,
	"phone" text,
	"email" text,
	"location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"working_hours" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offices_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"title" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_id" uuid,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"full_name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"academic_degree" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"academic_title" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"bio" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_id" uuid,
	"email" text,
	"phone" text,
	"location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"orcid" text,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "persons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"code" text,
	"degree_id" uuid NOT NULL,
	"faculty_id" uuid NOT NULL,
	"department_id" uuid,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"duration_years" integer,
	"credits" integer,
	"languages" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"study_form" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_id" uuid,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "search_documents" (
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"tsv" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector(CASE locale WHEN 'ru' THEN 'russian'::regconfig WHEN 'en' THEN 'english'::regconfig ELSE 'simple'::regconfig END, title), 'A')
       || setweight(to_tsvector(CASE locale WHEN 'ru' THEN 'russian'::regconfig WHEN 'en' THEN 'english'::regconfig ELSE 'simple'::regconfig END, summary), 'B')
       || setweight(to_tsvector(CASE locale WHEN 'ru' THEN 'russian'::regconfig WHEN 'en' THEN 'english'::regconfig ELSE 'simple'::regconfig END, body), 'C')) STORED,
	CONSTRAINT "search_documents_entity_type_entity_id_locale_pk" PRIMARY KEY("entity_type","entity_id","locale")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_orgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"category" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_id" uuid,
	"faculty_id" uuid,
	"leader_name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"email" text,
	"social_url" text,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_orgs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'EDITOR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_degree_id_degrees_id_fk" FOREIGN KEY ("degree_id") REFERENCES "public"."degrees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "degrees" ADD CONSTRAINT "degrees_image_id_media_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_image_id_media_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_image_id_media_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_folder_id_media_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_media_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media_folders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parent_id_menu_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_image_id_media_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offices" ADD CONSTRAINT "offices_parent_id_offices_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."offices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offices" ADD CONSTRAINT "offices_image_id_media_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_image_id_media_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_image_id_media_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_degree_id_degrees_id_fk" FOREIGN KEY ("degree_id") REFERENCES "public"."degrees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_image_id_media_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_orgs" ADD CONSTRAINT "student_orgs_image_id_media_files_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_orgs" ADD CONSTRAINT "student_orgs_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "appointments_person_idx" ON "appointments" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "appointments_department_idx" ON "appointments" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "appointments_office_idx" ON "appointments" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "appointments_faculty_idx" ON "appointments" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "appointments_kind_idx" ON "appointments" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "departments_faculty_idx" ON "departments" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "events_faculty_idx" ON "events" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "media_files_folder_idx" ON "media_files" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "media_folders_parent_idx" ON "media_folders" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "menu_items_location_idx" ON "menu_items" USING btree ("location","sort_order");--> statement-breakpoint
CREATE INDEX "news_published_at_idx" ON "news" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "news_faculty_idx" ON "news" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "offices_parent_idx" ON "offices" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "programs_degree_idx" ON "programs" USING btree ("degree_id");--> statement-breakpoint
CREATE INDEX "programs_faculty_idx" ON "programs" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "programs_department_idx" ON "programs" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "search_documents_tsv_idx" ON "search_documents" USING gin ("tsv");--> statement-breakpoint
CREATE INDEX "search_documents_title_trgm_idx" ON "search_documents" USING gin (title gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "search_documents_locale_idx" ON "search_documents" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "student_orgs_faculty_idx" ON "student_orgs" USING btree ("faculty_id");