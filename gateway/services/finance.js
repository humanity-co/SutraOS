/**
 * SUTRAOS FEE INVOICING & SUB-LEDGER POSTING ENGINE
 * Implements double-entry ledger invoicing, automated payment vouchers,
 * student sub-ledger balance audits, and financial hall-ticket blocks.
 */

import { querySecure } from '../db.js';

// In-memory Ledger lines storage (simulating general_ledger_lines for sub-ledger computations)
const mockLedgerLines = [
  // Empty by default for new transactions
];

/**
 * Calculates a student's current outstanding Accounts Receivable balance.
 * Summarizes all debits and credits posted to their sub-ledger.
 * 
 * @param {string} studentId - Student identifier
 * @returns {number} Current balance (Debits - Credits)
 */
export function getStudentOutstandingBalance(studentId) {
  // Account 1200 is student tuition receivables
  const studentLines = mockLedgerLines.filter(l => l.student_id === studentId && l.account_code === '1200');
  
  const debits = studentLines.reduce((sum, l) => sum + l.debit_amount, 0);
  const credits = studentLines.reduce((sum, l) => sum + l.credit_amount, 0);
  
  return parseFloat((debits - credits).toFixed(2));
}

/**
 * Generates an Invoice journal entry for student fees.
 * Debit: Accounts Receivable (1200) - ₹Amount
 * Credit: Deferred Tuition Revenue (2001) - ₹Amount
 * 
 * @param {string} studentId - Student ID
 * @param {number} amount - Invoice value
 * @param {string} creatorUserId - User ID of creator
 */
export function issueStudentInvoice(studentId, amount, creatorUserId) {
  const entryId = Math.random().toString(36).substring(2, 15);

  // Issue Double-Entry Lines
  const lineDebit = {
    line_id: Math.random().toString(36).substring(2, 15),
    entry_id: entryId,
    account_code: '1200', // Receivables (Asset)
    student_id: studentId,
    debit_amount: amount,
    credit_amount: 0.00
  };

  const lineCredit = {
    line_id: Math.random().toString(36).substring(2, 15),
    entry_id: entryId,
    account_code: '2001', // Deferred Revenue (Liability)
    student_id: null,
    debit_amount: 0.00,
    credit_amount: amount
  };

  mockLedgerLines.push(lineDebit);
  mockLedgerLines.push(lineCredit);

  console.log(`[Finance Engine] Issued Invoice: Student ${studentId} billed ₹${amount}. Debits = Credits = ₹${amount}.`);

  return {
    status: 'INVOICED',
    entry_id: entryId,
    amount_invoiced: amount,
    outstanding_balance: getStudentOutstandingBalance(studentId)
  };
}

/**
 * Processes a student fee payment and posts settling double-entry lines.
 * Debit: Cash/Bank Account (1001) - ₹Amount
 * Credit: Accounts Receivable (1200) - ₹Amount
 * 
 * @param {string} studentId - Student ID
 * @param {number} amount - Amount paid
 * @param {string} paymentReference - Bank reference
 */
export function processStudentPayment(studentId, amount, paymentReference) {
  const currentBalance = getStudentOutstandingBalance(studentId);
  if (currentBalance <= 0) {
    throw new Error('Transaction Rejected: Student has no outstanding balance due.');
  }

  if (amount > currentBalance) {
    throw new Error(`Transaction Rejected: Payment amount (₹${amount}) exceeds outstanding balance (₹${currentBalance}).`);
  }

  const entryId = Math.random().toString(36).substring(2, 15);

  // Post Settling Double-Entry Ledger Lines
  const lineDebit = {
    line_id: Math.random().toString(36).substring(2, 15),
    entry_id: entryId,
    account_code: '1001', // Cash/Bank (Asset)
    student_id: null,
    debit_amount: amount,
    credit_amount: 0.00
  };

  const lineCredit = {
    line_id: Math.random().toString(36).substring(2, 15),
    entry_id: entryId,
    account_code: '1200', // Receivables (Asset decreased)
    student_id: studentId,
    debit_amount: 0.00,
    credit_amount: amount
  };

  mockLedgerLines.push(lineDebit);
  mockLedgerLines.push(lineCredit);

  console.log(`[Finance Engine] Payment Processed: Reference ${paymentReference} received. student_id ${studentId} cleared ₹${amount}.`);

  return {
    status: 'PAID',
    entry_id: entryId,
    payment_reference: paymentReference,
    amount_cleared: amount,
    outstanding_balance: getStudentOutstandingBalance(studentId)
  };
}
