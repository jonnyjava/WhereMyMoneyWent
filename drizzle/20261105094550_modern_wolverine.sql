CREATE SCHEMA "reference";
--> statement-breakpoint
CREATE TABLE "reference"."loans" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"borrower_email" text NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"extensions" integer DEFAULT 0 NOT NULL,
	"returned_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reference"."return_counters" (
	"id" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"counted_loan_ids" jsonb DEFAULT '[]'::jsonb NOT NULL
);
