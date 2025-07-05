CREATE TYPE "public"."export_format" AS ENUM('csv', 'json', 'xlsx');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."species_type" AS ENUM('arctic', 'great');--> statement-breakpoint
CREATE TABLE "event_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_data" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid,
	"species_type" "species_type" NOT NULL,
	"length" numeric(6, 2) NOT NULL,
	"breadth" numeric(6, 2) NOT NULL,
	"mass" numeric(8, 3) NOT NULL,
	"kv" numeric(4, 3) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(11, 7),
	"site_name" varchar(255),
	"researcher_notes" text,
	"submitted_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"measurement_id" uuid NOT NULL,
	"tbh" numeric(6, 2) NOT NULL,
	"egg_density" numeric(8, 4) NOT NULL,
	"egg_volume" numeric(8, 4) NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"species_type" "species_type" NOT NULL,
	"formula_name" varchar(50) NOT NULL,
	"formula_version" varchar(10) NOT NULL,
	"formula_coefficients" jsonb,
	"calculated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_exports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"export_format" "export_format" NOT NULL,
	"exported_by" varchar(255) NOT NULL,
	"export_options" jsonb,
	"file_size" integer,
	"download_url" varchar(500),
	"exported_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_name" varchar(255) NOT NULL,
	"researcher_id" varchar(255) NOT NULL,
	"start_location" jsonb,
	"expected_duration" integer,
	"research_goals" text,
	"measurement_count" integer DEFAULT 0 NOT NULL,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validation_errors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"measurement_id" uuid,
	"error_type" varchar(50) NOT NULL,
	"error_message" text NOT NULL,
	"field_name" varchar(50),
	"field_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_measurement_id_measurements_id_fk" FOREIGN KEY ("measurement_id") REFERENCES "public"."measurements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exports" ADD CONSTRAINT "session_exports_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_errors" ADD CONSTRAINT "validation_errors_measurement_id_measurements_id_fk" FOREIGN KEY ("measurement_id") REFERENCES "public"."measurements"("id") ON DELETE no action ON UPDATE no action;