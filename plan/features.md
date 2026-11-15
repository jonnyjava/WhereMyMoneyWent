# Where My Money Went

A daily expense tracket to keep money under control.

## Constraints
- Users are identified by their email address.

## F-001 Create an expense-category
Goal: Create an expense categorization.
Priority: must
Context: expenses
Criteria:
- An user can create, edit, and delete an expense-category.
- an user can list all his expense-categories under the form to create them
- Names must be unique per user
- an expense-category belongs to a user, a user can have as many expense-category as he needs 
Out of scope:
- subcategories
- user registration and login

## F-002 Expense-subcategory
Goal: an user can detail as many expense-subcategory he needs under an expense-category
Priority: must
Depends on: F-001
Context: expenses
Criteria:
- An user can create, edit, and delete an expense-subcategory.
- an user can list all his expense-subcategories under the expense-category they belong to
- Names must be unique per expense-category but they can repeat under differents expense-categories
- an expense-subcategory belongs to a single expense-category. and expense-category can have as many expense-subcategory as the user needs
- deleting an expense-category destroys in cascade all its expense-subcategories
Out of scope:
- user registration and login

## F-003 Register an expense
Goal: An user can register an expense.
Priority: must
Depends on: F-002 
Context: expense
Criteria:
- an user can create, delete, and edit an expense
- an expense belongs to a user.
- an expense has the following attributes: amount (always bigger than 0), category (if the expense-category has no expense-subcategory) or expense-subcategory and date (by default today) plus the reference to the user it belongs to (not visible nor editable)
- expenses are listed under the form to register them, ordered by date

Out of scope:
- user registration and login
