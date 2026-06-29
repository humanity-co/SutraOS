/**
 * SUTRAOS LIBRARY CATALOG & CIRCULATION LEDGER
 * Tracks book reservation queues, circulation logs, and overdue locks.
 */

// In-memory student library record
const mockLibraryLogs = {
  // student_john (No overdues)
  '2fc6d2e7-8901-2345-0123-ef0123456789': {
    active_checkouts: ['Book: Clean Code'],
    overdue_books: []
  },
  // student_poor (Has overdue books)
  'student-uuid-poor': {
    active_checkouts: ['Book: Introduction to Algorithms'],
    overdue_books: ['Book: Introduction to Algorithms'] // Overdue block active
  }
};

/**
 * Checks out a book from the catalog for a student.
 */
export function checkoutLibraryBook(studentId, bookTitle) {
  const record = mockLibraryLogs[studentId] || { active_checkouts: [], overdue_books: [] };

  // Block if student has overdue books
  if (record.overdue_books.length > 0) {
    throw new Error(`Library Block: Cannot check out new books. You have ${record.overdue_books.length} overdue books outstanding.`);
  }

  // Complete checkout
  record.active_checkouts.push(bookTitle);
  console.log(`[Library Ledger] Checked out book: [${bookTitle}] to Student: ${studentId}.`);

  return {
    status: 'ISSUED',
    student_id: studentId,
    book_title: bookTitle,
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 14 days circulation
  };
}
