/**
 * SUTRAOS HR PAYROLL & FACULTY APPRAISAL ENGINE
 * Tracks research appraisals (SCOPUS publications), teaching workloads,
 * and salary general ledger lines postings.
 */

// In-memory faculty appraisals database
const mockFacultyHRData = {
  // Faculty Anjali Verma
  '1eb5c1d6-7890-1234-9012-def012345678': {
    scopus_publications: 4,
    student_feedback_rating: 4.60,
    teaching_hours_weekly: 18,
    monthly_basic_salary: 80000.00
  }
};

/**
 * Computes an NBA-compliant appraisal score for faculty performance reviews.
 */
export function calculateFacultyAppraisal(facultyId) {
  const profile = mockFacultyHRData[facultyId];
  if (!profile) {
    throw new Error('Faculty employee record not found.');
  }

  // UGC Appraisal Index Formula:
  // (Feedback * 10) + (Workload * 2) + (Scopus * 5)
  const score = (profile.student_feedback_rating * 10) + (profile.teaching_hours_weekly * 2) + (profile.scopus_publications * 5);
  let grade = 'SATISFACTORY';
  if (score >= 90) {
    grade = 'OUTSTANDING';
  } else if (score >= 75) {
    grade = 'EXCELLENT';
  } else if (score < 50) {
    grade = 'NEED_IMPROVEMENT';
  }

  return {
    faculty_id: facultyId,
    appraisal_score: parseFloat(score.toFixed(2)),
    performance_grade: grade,
    metrics: {
      feedback: profile.student_feedback_rating,
      workload_hours: profile.teaching_hours_weekly,
      scopus_count: profile.scopus_publications
    }
  };
}

/**
 * Posts double-entry salary disbursement journals to the ledger.
 * Debit: Faculty Salary Expense (4001) - ₹Amount
 * Credit: HDFC Cash/Bank Account (1001) - ₹Amount
 */
export function disburseFacultySalary(facultyId) {
  const profile = mockFacultyHRData[facultyId];
  if (!profile) {
    throw new Error('Faculty details not found.');
  }

  const amount = profile.monthly_basic_salary;
  const entryId = Math.random().toString(36).substring(2, 15);

  // Journal Lines
  const lineDebit = {
    line_id: Math.random().toString(36).substring(2, 15),
    entry_id: entryId,
    account_code: '4001', // Salary Expense (Debit increases expense)
    faculty_id: facultyId,
    debit_amount: amount,
    credit_amount: 0.00
  };

  const lineCredit = {
    line_id: Math.random().toString(36).substring(2, 15),
    entry_id: entryId,
    account_code: '1001', // Cash/Bank (Credit decreases asset)
    faculty_id: null,
    debit_amount: 0.00,
    credit_amount: amount
  };

  console.log(`[HR Ledger] Salary Posted: Faculty ${facultyId} paid ₹${amount}. Debits = Credits = ₹${amount}.`);

  return {
    status: 'PAID',
    entry_id: entryId,
    amount_paid: amount,
    debit_line: lineDebit,
    credit_line: lineCredit
  };
}
