CREATE TABLE "expenses"."expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_email" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"spent_on" date NOT NULL,
	"category_id" text NOT NULL,
	"subcategory_id" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses"."expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "expenses"."expense_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses"."expenses" ADD CONSTRAINT "expenses_subcategory_id_expense_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "expenses"."expense_subcategories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_owner_spent_on_created_at_idx" ON "expenses"."expenses" USING btree ("owner_email","spent_on","created_at");