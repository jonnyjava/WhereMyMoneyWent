CREATE TABLE "expenses"."expense_subcategories" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses"."expense_subcategories" ADD CONSTRAINT "expense_subcategories_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "expenses"."expense_categories"("id") ON DELETE cascade ON UPDATE no action;