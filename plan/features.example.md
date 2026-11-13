# Neighborhood Library

A small web service where members borrow and return books from a shared catalog.

## Constraints
- Members are identified by their email address.
- A loan lasts 14 days and can be extended once.

## F-001 Browse the catalog
Goal: Anyone can see which books exist and whether they are available.
Priority: must
Context: catalog
Criteria:
- Anyone can list all books with title, author and availability.
- Searching by title returns only matching books.
Out of scope:
- Reserving a book that is out.

## F-002 Borrow a book
Goal: A member can borrow an available book.
Priority: must
Depends on: F-001
Context: circulation
Criteria:
- A member can borrow an available book.
- Borrowing a book that is already out is refused.
- The due date is 14 days after the borrow date.

## F-003 Return a book
Goal: A member can return a borrowed book so it becomes available again.
Priority: must
Depends on: F-002
Context: circulation
Criteria:
- Returning a loaned book makes it available again.
- Returning a book twice is refused.
Notes: Late fees are decided later and are not part of this version.
