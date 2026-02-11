CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"luma_event_id" text NOT NULL,
	"status" text DEFAULT 'registered' NOT NULL,
	"checked_in_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_member_event_unique" UNIQUE("member_id","luma_event_id")
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"icon_ascii" text NOT NULL,
	"criteria" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "badges_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "demo_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"requested_time" text,
	"duration_minutes" integer DEFAULT 5 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"confirmed_by_organizer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"luma_event_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_url" text,
	"url" text NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp,
	"timezone" text NOT NULL,
	"location" jsonb,
	"stats" jsonb DEFAULT '{"registered":0,"checkedIn":0}'::jsonb NOT NULL,
	"is_canceled" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_luma_event_id_unique" UNIQUE("luma_event_id")
);
--> statement-breakpoint
CREATE TABLE "luma_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"signature" text,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_badges" (
	"member_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_badges_member_id_badge_id_pk" PRIMARY KEY("member_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "pending_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"luma_attendee_id" text NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_users_email_unique" UNIQUE("email"),
	CONSTRAINT "pending_users_luma_attendee_id_unique" UNIQUE("luma_attendee_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text,
	"luma_email" text NOT NULL,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"is_app_admin" boolean DEFAULT false NOT NULL,
	"luma_attendee_id" text,
	"bio" text,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"github_username" text,
	"twitter_handle" text,
	"website_url" text,
	"role" text,
	"seeking_funding" boolean DEFAULT false NOT NULL,
	"open_to_mentoring" boolean DEFAULT false NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"onboarding_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_luma_email_unique" UNIQUE("luma_email"),
	CONSTRAINT "profiles_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"github_url" text,
	"public_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "survey_responses_survey_member_unique" UNIQUE("survey_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"questions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "surveys_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_member_id_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_slots" ADD CONSTRAINT "demo_slots_member_id_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_slots" ADD CONSTRAINT "demo_slots_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_badges" ADD CONSTRAINT "member_badges_member_id_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_badges" ADD CONSTRAINT "member_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_member_id_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_member_id_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_member_id_idx" ON "attendance" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "attendance_luma_event_id_idx" ON "attendance" USING btree ("luma_event_id");--> statement-breakpoint
CREATE INDEX "demo_slots_member_id_idx" ON "demo_slots" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "demo_slots_event_id_idx" ON "demo_slots" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "demo_slots_status_idx" ON "demo_slots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_start_at_idx" ON "events" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "member_badges_member_id_idx" ON "member_badges" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_badges_badge_id_idx" ON "member_badges" USING btree ("badge_id");--> statement-breakpoint
CREATE INDEX "profiles_clerk_user_id_idx" ON "profiles" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "profiles_luma_email_idx" ON "profiles" USING btree ("luma_email");--> statement-breakpoint
CREATE INDEX "profiles_luma_attendee_id_idx" ON "profiles" USING btree ("luma_attendee_id");--> statement-breakpoint
CREATE INDEX "profiles_github_username_idx" ON "profiles" USING btree ("github_username");--> statement-breakpoint
CREATE INDEX "projects_member_id_idx" ON "projects" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "survey_responses_survey_id_idx" ON "survey_responses" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_responses_member_id_idx" ON "survey_responses" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "surveys_type_idx" ON "surveys" USING btree ("type");--> statement-breakpoint
CREATE INDEX "surveys_is_active_idx" ON "surveys" USING btree ("is_active");