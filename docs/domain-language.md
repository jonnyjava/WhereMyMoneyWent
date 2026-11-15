# Domain language

The words used in this project, per bounded context. Agents use these terms for all names.
If a concept is missing, add it under "Proposed terms" instead of inventing a name. A human
moves accepted terms into the context's section.

## Reference contexts (pattern examples only)
- **Loan**: a borrower holds a book until a due date. Can be extended once, then returned.
- **Return counter**: how many loans have been returned.

## `expenses`
Expense categories and subcategories a user owns, and the expenses recorded under them.
- **User**: A person identified by their email address.
- **ExpenseCategory**: A named grouping of expenses that belongs to a user and is unique among that user's categories.
- **ExpenseSubcategory**: A named detail under one expense-category, unique within that category and deletable with it.
- **Expense**: An amount spent on a date, attributed either to an expense-category or to one of its expense-subcategories.

## Proposed terms
<!-- Agents add entries here: term, context, one-line meaning, why it is needed. -->
