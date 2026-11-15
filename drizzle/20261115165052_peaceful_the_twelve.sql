CREATE SCHEMA "expenses";
--> statement-breakpoint
CREATE TABLE "expenses"."expense_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_owner_name_key" ON "expenses"."expense_categories" USING btree ("owner_email","name");