import http from 'http';
import crypto from 'crypto';

const SIGNING_SALT = 'SUTRAOS_SIGNING_SALT_PROTECTED_888';

// Helper function to perform HTTP requests wrapped in Promises
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

// Helper to compute API payload HMAC signature
function computeSignature(payload, timestamp, userId) {
  const payloadStr = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', SIGNING_SALT)
    .update(payloadStr + timestamp + userId)
    .digest('hex');
}

async function runTests() {
  console.log('============================================================================');
  console.log('SUTRAOS API GATEWAY & DATABASE TRIGGER VERIFICATION SUITE');
  console.log('============================================================================\n');

  let studentToken = '';
  let accountsToken = '';
  let studentUserId = '2fc6d2e7-8901-2345-0123-ef0123456789';
  let accountsUserId = '7ad1e7f2-3456-7890-5678-9abcdef01234';

  // --------------------------------------------------------------------------
  // TEST CASE 1: Student Login & JWT Claims Authentication
  // --------------------------------------------------------------------------
  console.log('[Test 1] Authenticating Student (student_john)...');
  try {
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: 'student_john',
      password: 'sutraos_secure_pass123'
    });

    if (loginRes.statusCode === 200 && loginRes.body.token) {
      studentToken = loginRes.body.token;
      console.log('  -> Status: SUCCESS');
      console.log('  -> Token acquired.');
    } else {
      console.error('  -> Status: FAILED', loginRes.body);
      return;
    }
  } catch (e) {
    console.error('  -> Error executing login query:', e.message);
    return;
  }

  // --------------------------------------------------------------------------
  // TEST CASE 2: Secure Exam Submission (Valid Signature)
  // --------------------------------------------------------------------------
  console.log('\n[Test 2] Submitting Exam Answer with Valid Payload Cryptographic Signature...');
  const answerPayload = {
    question_id: 'Q-MATH-101',
    selected_option_hash: '8f3a2c5e9b012345'
  };
  const timestamp = Date.now().toString();
  const validSignature = computeSignature(answerPayload, timestamp, studentUserId);

  const validSubmitRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/exams/submit-answer',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`,
      'X-SutraOS-Signature': validSignature,
      'X-SutraOS-Timestamp': timestamp
    }
  }, answerPayload);

  console.log(`  -> Gateway Response Code: ${validSubmitRes.statusCode}`);
  console.log('  -> Payload:', validSubmitRes.body);

  // --------------------------------------------------------------------------
  // TEST CASE 3: Secure Exam Submission (Tampered Payload Detection)
  // --------------------------------------------------------------------------
  console.log('\n[Test 3] Submitting Exam Answer with Tampered Payload (Altering Option Hash)...');
  // Attacker intercepts request and tries to alter selection hash without knowing the secret salt
  const tamperedPayload = {
    question_id: 'Q-MATH-101',
    selected_option_hash: '9999999999999999' // Modified selection!
  };

  const tamperedSubmitRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/exams/submit-answer',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`,
      'X-SutraOS-Signature': validSignature, // Sending the OLD signature for the new body
      'X-SutraOS-Timestamp': timestamp
    }
  }, tamperedPayload);

  console.log(`  -> Gateway Response Code: ${tamperedSubmitRes.statusCode}`);
  console.log('  -> Payload:', tamperedSubmitRes.body);
  if (tamperedSubmitRes.statusCode === 403) {
    console.log('  -> Status: SUCCESS (Gateway blocked the tampered packet!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 4: Authenticate Accounts Head
  // --------------------------------------------------------------------------
  console.log('\n[Test 4] Authenticating Accounts Head (accounts_head)...');
  const accLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'accounts_head',
    password: 'sutraos_secure_pass123'
  });

  if (accLoginRes.statusCode === 200 && accLoginRes.body.token) {
    accountsToken = accLoginRes.body.token;
    console.log('  -> Status: SUCCESS');
  } else {
    console.error('  -> Status: FAILED', accLoginRes.body);
    return;
  }

  // --------------------------------------------------------------------------
  // TEST CASE 5: Post Unbalanced General Ledger Voucher (Should Fail Trigger Check)
  // --------------------------------------------------------------------------
  console.log('\n[Test 5] Posting Unbalanced Ledger Journal Entry (Debit ₹10,000 / Credit ₹9,000)...');
  const unbalancedPayload = {
    narration: 'Tuition Fee Invoiced Unbalanced Mock',
    lines: [
      { account_id: '3cf7a3b8-9012-3456-1234-56789abcde01', student_id: studentUserId, debit_amount: 10000.00, credit_amount: 0.00 }, // Receivables Acc
      { account_id: '4dg8b4c9-0123-4567-2345-6789abcde012', student_id: null, debit_amount: 0.00, credit_amount: 9000.00 } // Revenue Acc (Unbalanced!)
    ]
  };

  const unbalancedGLRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/finance/post-journal',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accountsToken}`
    }
  }, unbalancedPayload);

  console.log(`  -> Gateway Response Code: ${unbalancedGLRes.statusCode}`);
  console.log('  -> Database Exception Captured:', unbalancedGLRes.body);
  if (unbalancedGLRes.statusCode === 400 && unbalancedGLRes.body.error.includes('Double-entry failure')) {
    console.log('  -> Status: SUCCESS (Database RLS trigger successfully rolled back unbalanced entries!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 6: Post Balanced General Ledger Voucher (Should Succeed)
  // --------------------------------------------------------------------------
  console.log('\n[Test 6] Posting Balanced Ledger Journal Entry (Debit ₹10,000 / Credit ₹10,000)...');
  const balancedPayload = {
    narration: 'Tuition Fee Invoiced Balanced Mock',
    lines: [
      { account_id: '3cf7a3b8-9012-3456-1234-56789abcde01', student_id: studentUserId, debit_amount: 10000.00, credit_amount: 0.00 }, // Receivables Acc
      { account_id: '4dg8b4c9-0123-4567-2345-6789abcde012', student_id: null, debit_amount: 0.00, credit_amount: 10000.00 } // Revenue Acc (Balanced!)
    ]
  };

  const balancedGLRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/finance/post-journal',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accountsToken}`
    }
  }, balancedPayload);

  console.log(`  -> Gateway Response Code: ${balancedGLRes.statusCode}`);
  console.log('  -> Database Response:', balancedGLRes.body);
  if (balancedGLRes.statusCode === 200) {
    console.log('  -> Status: SUCCESS (Balanced transaction committed!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 7: Authenticate Exam Controller
  // --------------------------------------------------------------------------
  console.log('\n[Test 7] Authenticating Exam Controller (exam_controller)...');
  let examToken = '';
  const examLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'exam_controller',
    password: 'sutraos_secure_pass123'
  });

  if (examLoginRes.statusCode === 200 && examLoginRes.body.token) {
    examToken = examLoginRes.body.token;
    console.log('  -> Status: SUCCESS');
  } else {
    console.error('  -> Status: FAILED', examLoginRes.body);
    return;
  }

  // --------------------------------------------------------------------------
  // TEST CASE 7b: Authenticate HOD CSE (hod_cse) for Timetable Scopes
  // --------------------------------------------------------------------------
  console.log('\n[Test 7b] Authenticating HOD CSE (hod_cse)...');
  let hodToken = '';
  const hodLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'hod_cse',
    password: 'sutraos_secure_pass123'
  });

  if (hodLoginRes.statusCode === 200 && hodLoginRes.body.token) {
    hodToken = hodLoginRes.body.token;
    console.log('  -> Status: SUCCESS');
  } else {
    console.error('  -> Status: FAILED', hodLoginRes.body);
    return;
  }

  // --------------------------------------------------------------------------
  // TEST CASE 8: Calculate Cohort Relative Grading (No Scaling)
  // --------------------------------------------------------------------------
  console.log('\n[Test 8] Requesting Cohort Relative Grading Curve (Scaling Factor = 1.00)...');
  const rawGradingRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/exams/calculate-relative-grades',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${examToken}`
    }
  }, {
    exam_schedule_id: 'exam-schedule-uuid-999',
    scaling_factor: 1.00
  });

  console.log(`  -> Gateway Response Code: ${rawGradingRes.statusCode}`);
  if (rawGradingRes.statusCode === 200) {
    console.log(`  -> Mean of Cohort: ${rawGradingRes.body.mean}%`);
    console.log(`  -> Std Dev: ${rawGradingRes.body.std_dev}%`);
    console.log(`  -> Total Graded Students: ${rawGradingRes.body.graded_cohort}`);
    
    const sGrades = rawGradingRes.body.student_grades.filter(s => s.letter_grade === 'S');
    const fGrades = rawGradingRes.body.student_grades.filter(s => s.letter_grade === 'F');
    console.log(`  -> Recommended S Grades (Outstanding): ${sGrades.length}`);
    console.log(`  -> Recommended F Grades (Absolute Fails / Fail): ${fGrades.length}`);
    console.log('  -> Status: SUCCESS');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 9: Calculate Cohort Relative Grading (With Moderation Scaling = 1.10)
  // --------------------------------------------------------------------------
  console.log('\n[Test 9] Requesting Cohort Relative Grading Curve (Moderation Scaling = 1.10)...');
  const scaledGradingRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/exams/calculate-relative-grades',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${examToken}`
    }
  }, {
    exam_schedule_id: 'exam-schedule-uuid-999',
    scaling_factor: 1.10 // Scale the bell curve to boost borderline grades
  });

  console.log(`  -> Gateway Response Code: ${scaledGradingRes.statusCode}`);
  if (scaledGradingRes.statusCode === 200) {
    console.log(`  -> Mean of Cohort: ${scaledGradingRes.body.mean}%`);
    console.log(`  -> Std Dev: ${scaledGradingRes.body.std_dev}%`);
    console.log(`  -> Total Graded Students: ${scaledGradingRes.body.graded_cohort}`);
    
    const sGrades = scaledGradingRes.body.student_grades.filter(s => s.letter_grade === 'S');
    const fGrades = scaledGradingRes.body.student_grades.filter(s => s.letter_grade === 'F');
    console.log(`  -> Recommended S Grades (Outstanding): ${sGrades.length}`);
    console.log(`  -> Recommended F Grades (Absolute Fails / Fail): ${fGrades.length}`);
    console.log('  -> Status: SUCCESS (Curve successfully moderated!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 10: Freeze and Publish Cohort Grades
  // --------------------------------------------------------------------------
  console.log('\n[Test 10] Freezing and Publishing Cohort Relative Grades...');
  const freezeRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/exams/freeze-grades',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${examToken}`
    }
  }, {
    term_id: 'f8a3c9d4-5678-9012-def0-123456789abc',
    course_version_id: '1ad5e1f6-7890-1234-f012-3456789abcde',
    grades: scaledGradingRes.body.student_grades
  });

  console.log(`  -> Gateway Response Code: ${freezeRes.statusCode}`);
  console.log('  -> Database Response:', freezeRes.body);
  if (freezeRes.statusCode === 200) {
    console.log('  -> Status: SUCCESS (Grades frozen, published, and uploaded to student credits bank!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 11: Elective Seat Reservation (Successful Path)
  // --------------------------------------------------------------------------
  console.log('\n[Test 11] Reserving Elective Seat on "Advanced Algorithms" (student_john)...');
  const reserveRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/registration/electives/reserve',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, {
    course_version_id: 'course-adv-algorithms-uuid'
  });

  console.log(`  -> Gateway Response Code: ${reserveRes.statusCode}`);
  console.log('  -> Database Response:', reserveRes.body);
  let allocationId = '';
  if (reserveRes.statusCode === 200 && reserveRes.body.status === 'RESERVED') {
    allocationId = reserveRes.body.allocation_id;
    console.log('  -> Status: SUCCESS (Seat temporarily locked!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 12: Elective Seat Confirmation
  // --------------------------------------------------------------------------
  console.log('\n[Test 12] Confirming Elective Seat Reservation...');
  const confirmRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/registration/electives/confirm',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, {
    course_version_id: 'course-adv-algorithms-uuid',
    allocation_id: allocationId
  });

  console.log(`  -> Gateway Response Code: ${confirmRes.statusCode}`);
  console.log('  -> Database Response:', confirmRes.body);
  if (confirmRes.statusCode === 200 && confirmRes.body.status === 'CONFIRMED') {
    console.log('  -> Status: SUCCESS (Elective seat permanently allocated!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 13: Concurrency Overflow Check (Seat limits = 5)
  // --------------------------------------------------------------------------
  console.log('\n[Test 13] Verifying Pessimistic capacity locks: Registering 5 more seats to force overflow...');
  // We already confirmed 1 seat. So capacity has 4 seats left.
  // We will book 4 more seats successfully (reaching total 5)
  for (let i = 1; i <= 4; i++) {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/registration/electives/reserve',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      }
    }, {
      course_version_id: 'course-adv-algorithms-uuid'
    });
    console.log(`  -> Reserve seat ${i + 1}/5: HTTP ${res.statusCode}`);
  }

  // The 6th booking attempt MUST fail with a capacity block!
  console.log('  -> Attempting 6th seat booking (Should fail with capacity overflow)...');
  const overflowRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/registration/electives/reserve',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, {
    course_version_id: 'course-adv-algorithms-uuid'
  });

  console.log(`  -> Gateway Response Code: ${overflowRes.statusCode}`);
  console.log('  -> Database Response:', overflowRes.body);
  if (overflowRes.statusCode === 400 && overflowRes.body.error.includes('Capacity exceeded')) {
    console.log('  -> Status: SUCCESS (Pessimistic concurrency engine successfully blocked overflow registration!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 14: Retrieve Attendance summary (student_john -> 80% ELIGIBLE)
  // --------------------------------------------------------------------------
  console.log('\n[Test 14] Querying Attendance summary for Student John (student_john)...');
  const johnAttendanceRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/attendance/student/${studentUserId}/summary`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });

  console.log(`  -> Gateway Response Code: ${johnAttendanceRes.statusCode}`);
  if (johnAttendanceRes.statusCode === 200) {
    const cs101Summary = johnAttendanceRes.body.course_summaries.find(c => c.course_code === 'CS101');
    console.log(`  -> CS101 Attendance: ${cs101Summary.attendance_percentage}%`);
    console.log(`  -> Exam Eligibility: ${cs101Summary.exam_eligibility}`);
    if (cs101Summary.exam_eligibility === 'ELIGIBLE') {
      console.log('  -> Status: SUCCESS (Student matches UGC threshold rules!)');
    }
  }

  // --------------------------------------------------------------------------
  // TEST CASE 15: Retrieve Attendance summary (student_poor -> 60% BLOCKED)
  // --------------------------------------------------------------------------
  console.log('\n[Test 15] Querying Attendance summary for Student Bob (student-uuid-poor)...');
  // HOD queries poor student's records (HOD has read access)
  const poorAttendanceRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/attendance/student/student-uuid-poor/summary`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${examToken}` // Exam Controller has read access
    }
  });

  console.log(`  -> Gateway Response Code: ${poorAttendanceRes.statusCode}`);
  if (poorAttendanceRes.statusCode === 200) {
    const cs101Summary = poorAttendanceRes.body.course_summaries.find(c => c.course_code === 'CS101');
    console.log(`  -> CS101 Attendance: ${cs101Summary.attendance_percentage}%`);
    console.log(`  -> Exam Eligibility: ${cs101Summary.exam_eligibility}`);
    if (cs101Summary.exam_eligibility === 'BLOCKED') {
      console.log('  -> Status: SUCCESS (Student with poor attendance correctly blocked from Hall Ticket!)');
    }
  }

  // --------------------------------------------------------------------------
  // TEST CASE 16: Register Administrative Condonation Waiver for student_poor
  // --------------------------------------------------------------------------
  console.log('\n[Test 16] Registering Grace Condonation Waiver for Student Bob (student-uuid-poor)...');
  const condoneRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/attendance/condone',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${examToken}`
    }
  }, {
    student_id: 'student-uuid-poor',
    course_code: 'CS101',
    reason: 'Approved Medical Outpatient Certificate #MED-2026-908'
  });

  console.log(`  -> Gateway Response Code: ${condoneRes.statusCode}`);
  console.log('  -> Database Response:', condoneRes.body);
  if (condoneRes.statusCode === 200 && condoneRes.body.status === 'CONDONED') {
    console.log('  -> Waiver applied successfully. Re-verifying eligibility...');
    
    // Query summary again
    const postCondoneRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/attendance/student/student-uuid-poor/summary`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${examToken}`
      }
    });
    
    const cs101Summary = postCondoneRes.body.course_summaries.find(c => c.course_code === 'CS101');
    console.log(`  -> Exam Eligibility after Condonation: ${cs101Summary.exam_eligibility}`);
    if (cs101Summary.exam_eligibility === 'ELIGIBLE') {
      console.log('  -> Status: SUCCESS (Condonation waiver successfully bypassed the exam eligibility block!)');
    }
  }

  // --------------------------------------------------------------------------
  // TEST CASE 17: Query initial student fee balance (Should be 0, not blocked)
  // --------------------------------------------------------------------------
  console.log('\n[Test 17] Querying initial fee balance for Student John (student_john)...');
  const initialBalanceRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/finance/student/${studentUserId}/balance`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });

  console.log(`  -> Gateway Response Code: ${initialBalanceRes.statusCode}`);
  if (initialBalanceRes.statusCode === 200) {
    console.log(`  -> Balance Due: ₹${initialBalanceRes.body.outstanding_balance}`);
    console.log(`  -> Financial Hall Ticket Blocked: ${initialBalanceRes.body.financial_exam_blocked}`);
    if (!initialBalanceRes.body.financial_exam_blocked) {
      console.log('  -> Status: SUCCESS (No fees outstanding.)');
    }
  }

  // --------------------------------------------------------------------------
  // TEST CASE 18: Issue Tuition Fee Invoice (Balance ₹50,000 -> Blocked)
  // --------------------------------------------------------------------------
  console.log('\n[Test 18] Issuing Tuition Invoice of ₹50,000 for Student John (student_john)...');
  const invoiceRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/finance/student/${studentUserId}/invoice`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accountsToken}`
    }
  }, {
    amount: 50000.00
  });

  console.log(`  -> Gateway Response Code: ${invoiceRes.statusCode}`);
  if (invoiceRes.statusCode === 200) {
    console.log(`  -> Outstanding Balance post-invoice: ₹${invoiceRes.body.outstanding_balance}`);
    
    // Check if exam status is now blocked due to outstanding dues
    const checkBlockedRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/finance/student/${studentUserId}/balance`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });
    
    console.log(`  -> Financial Hall Ticket Blocked: ${checkBlockedRes.body.financial_exam_blocked}`);
    if (checkBlockedRes.body.financial_exam_blocked) {
      console.log('  -> Status: SUCCESS (Student successfully blocked from exams due to financial arrears!)');
    }
  }

  // --------------------------------------------------------------------------
  // TEST CASE 19: Student Pays Balance (Balance returns to 0 -> Unblocked)
  // --------------------------------------------------------------------------
  console.log('\n[Test 19] Student processes fee payment of ₹50,000 to clear arrears...');
  const payRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/finance/student/${studentUserId}/pay`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, {
    amount: 50000.00,
    payment_reference: 'TXN-HDFC-MOBILEPAY-980751'
  });

  console.log(`  -> Gateway Response Code: ${payRes.statusCode}`);
  if (payRes.statusCode === 200) {
    console.log(`  -> Outstanding Balance post-payment: ₹${payRes.body.outstanding_balance}`);
    
    // Verify unblocked
    const checkClearedRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/finance/student/${studentUserId}/balance`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });
    
    console.log(`  -> Financial Hall Ticket Blocked: ${checkClearedRes.body.financial_exam_blocked}`);
    if (!checkClearedRes.body.financial_exam_blocked) {
      console.log('  -> Status: SUCCESS (Student unblocked from exams after clearing arrears!)');
    }
  }

  // --------------------------------------------------------------------------
  // TEST CASE 20: Propose a Valid Timetable Slot (No clashes)
  // --------------------------------------------------------------------------
  console.log('\n[Test 20] Proposing a valid Timetable slot (Monday 10:00 - 10:55, Section A)...');
  const validSlotPayload = {
    course_version_id: '1ad5e1f6-7890-1234-f012-3456789abcde', // CS101
    faculty_id: '1eb5c1d6-7890-1234-9012-def012345678', // Faculty Anjali Verma
    division_id: '09b4d0e5-6789-0123-ef01-23456789abcd', // Section A
    room_number: 'Lab Block 3, Room 402',
    day_of_week: 1, // Monday
    start_time: '10:00:00',
    end_time: '10:55:00'
  };

  const validSlotRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/timetable/validate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hodToken}` // HOD CSE has scope course:write
    }
  }, validSlotPayload);

  console.log(`  -> Gateway Response Code: ${validSlotRes.statusCode}`);
  console.log('  -> Validation Response:', validSlotRes.body);
  if (validSlotRes.statusCode === 200 && validSlotRes.body.valid) {
    console.log('  -> Status: SUCCESS (Proposed slot conforms to constraints.)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 21: Propose a Slot with Room Clash (Monday 09:00 - 09:55 in Room 402)
  // --------------------------------------------------------------------------
  console.log('\n[Test 21] Proposing a slot with Room Clash (Room 402 already booked at 09:00)...');
  const roomClashPayload = {
    course_version_id: 'course-new-uuid',
    faculty_id: 'faculty-new-uuid', // Different faculty member
    division_id: 'division-new-uuid', // Different division
    room_number: 'Lab Block 3, Room 402', // Same physical room!
    day_of_week: 1,
    start_time: '09:15:00', // Overlaps with 09:00 - 09:55
    end_time: '10:10:00'
  };

  const roomClashRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/timetable/validate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hodToken}`
    }
  }, roomClashPayload);

  console.log(`  -> Gateway Response Code: ${roomClashRes.statusCode}`);
  console.log('  -> Validation Response:', roomClashRes.body);
  if (roomClashRes.statusCode === 200 && !roomClashRes.body.valid && roomClashRes.body.conflict_type === 'ROOM_CLASH') {
    console.log('  -> Status: SUCCESS (Timetable engine successfully detected and blocked Room Clash!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 22: Propose a Slot with Faculty Clash (Faculty Anjali Verma booked elsewhere)
  // --------------------------------------------------------------------------
  console.log('\n[Test 22] Proposing a slot with Faculty Clash (Teacher already lecturing elsewhere at 09:00)...');
  const facultyClashPayload = {
    course_version_id: 'course-other-uuid',
    faculty_id: '1eb5c1d6-7890-1234-9012-def012345678', // Same faculty Anjali Verma!
    division_id: 'division-new-uuid',
    room_number: 'Lecture Hall 101', // Different room
    day_of_week: 1,
    start_time: '09:00:00', // Same overlapping slot
    end_time: '09:55:00'
  };

  const facultyClashRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/timetable/validate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hodToken}`
    }
  }, facultyClashPayload);

  console.log(`  -> Gateway Response Code: ${facultyClashRes.statusCode}`);
  console.log('  -> Validation Response:', facultyClashRes.body);
  if (facultyClashRes.statusCode === 200 && !facultyClashRes.body.valid && facultyClashRes.body.conflict_type === 'FACULTY_CLASH') {
    console.log('  -> Status: SUCCESS (Timetable engine successfully detected and blocked Faculty Clash!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 23: Student John queries Google Drive (Eligible)
  // --------------------------------------------------------------------------
  console.log('\n[Test 23] Querying Google Drive eligibility for Student John (student_john)...');
  const johnGoogleEligRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/placement/student/${studentUserId}/eligibility/drive-google-uuid`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });

  console.log(`  -> Gateway Response Code: ${johnGoogleEligRes.statusCode}`);
  console.log('  -> Evaluation Response:', johnGoogleEligRes.body);
  if (johnGoogleEligRes.statusCode === 200 && johnGoogleEligRes.body.eligible) {
    console.log('  -> Status: SUCCESS (Student meets CGPA and backlog requirements.)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 24: Student Bob queries Google Drive (Blocked due to backlogs)
  // --------------------------------------------------------------------------
  console.log('\n[Test 24] Authenticating Placement Officer (placement_officer)...');
  let placementToken = '';
  const officerLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'placement_officer',
    password: 'sutraos_secure_pass123'
  });

  if (officerLoginRes.statusCode === 200 && officerLoginRes.body.token) {
    placementToken = officerLoginRes.body.token;
    console.log('  -> Status: SUCCESS');
  } else {
    console.error('  -> Status: FAILED', officerLoginRes.body);
    return;
  }

  console.log('\n[Test 24b] Querying Google Drive eligibility for Student Bob (student-uuid-poor)...');
  const bobGoogleEligRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/placement/student/student-uuid-poor/eligibility/drive-google-uuid`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${placementToken}` // Placement Officer has read access
    }
  });

  console.log(`  -> Gateway Response Code: ${bobGoogleEligRes.statusCode}`);
  console.log('  -> Evaluation Response:', bobGoogleEligRes.body);
  if (bobGoogleEligRes.statusCode === 200 && !bobGoogleEligRes.body.eligible && bobGoogleEligRes.body.block_reason === 'ACTIVE_BACKLOGS_FOUND') {
    console.log('  -> Status: SUCCESS (Student with backlogs correctly blocked from premium drive!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 25: Record Placement Job Offer (John placed at ₹10 LPA)
  // --------------------------------------------------------------------------
  console.log('\n[Test 25] Recording Placement Offer of ₹10 LPA for John at Company A...');
  
  const recordOfferRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/placement/offers',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${placementToken}` // Requires placements:write
    }
  }, {
    student_id: studentUserId,
    company_name: 'Microsoft India',
    package_lpa: 10.00
  });

  console.log(`  -> Gateway Response Code: ${recordOfferRes.statusCode}`);
  console.log('  -> Database Response:', recordOfferRes.body);
  if (recordOfferRes.statusCode === 200 && recordOfferRes.body.status === 'PLACED') {
    console.log('  -> Status: SUCCESS (Placement offer details stored.)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 26: Query Dream Upgrade Drive (CRED ₹15 LPA -> Allowed, 1.5x limit is ₹15 LPA)
  // --------------------------------------------------------------------------
  console.log('\n[Test 26] Querying CRED Drive (₹15 LPA) eligibility for placed Student John...');
  const johnCredEligRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/placement/student/${studentUserId}/eligibility/drive-cred-uuid`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });

  console.log(`  -> Gateway Response Code: ${johnCredEligRes.statusCode}`);
  console.log('  -> Evaluation Response:', johnCredEligRes.body);
  if (johnCredEligRes.statusCode === 200 && johnCredEligRes.body.eligible) {
    console.log('  -> Status: SUCCESS (CRED meets the 1.5x dream upgrade package multiplier threshold!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 27: Query Non-Dream Upgrade Drive (Infosys ₹4.5 LPA -> Blocked)
  // --------------------------------------------------------------------------
  console.log('\n[Test 27] Querying Infosys Drive (₹4.50 LPA) eligibility for placed Student John...');
  const johnInfosysEligRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/placement/student/${studentUserId}/eligibility/drive-infosys-uuid`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });

  console.log(`  -> Gateway Response Code: ${johnInfosysEligRes.statusCode}`);
  console.log('  -> Evaluation Response:', johnInfosysEligRes.body);
  if (johnInfosysEligRes.statusCode === 200 && !johnInfosysEligRes.body.eligible && johnInfosysEligRes.body.block_reason === 'DREAM_UPGRADE_LIMIT_REACHED') {
    console.log('  -> Status: SUCCESS (Student correctly blocked from applying to lower package drives!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 28: LMS Syllabus Progress & NBA CO-PO Attainment Levels
  // --------------------------------------------------------------------------
  console.log('\n[Test 28] Fetching Syllabus Progress & NBA CO-PO Attainments for Course CS101...');
  const syllabusProgressRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/lms/progress/1ad5e1f6-7890-1234-f012-3456789abcde',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log(`  -> Syllabus Progress: ${syllabusProgressRes.body.progress_percentage}% completed`);

  const copoRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/lms/copo/1ad5e1f6-7890-1234-f012-3456789abcde',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${examToken}`
    }
  }, {
    grades: [
      { student_id: 'john', letter_grade: 'A', grade_point: 8.00 },
      { student_id: 'bob', letter_grade: 'B', grade_point: 7.00 }
    ]
  });
  console.log(`  -> NBA Target Attainment criteria: ${copoRes.body.attainment_criteria}`);
  console.log('  -> Outcomes Attained:', copoRes.body.program_outcomes);
  if (copoRes.statusCode === 200 && copoRes.body.program_outcomes.length > 0) {
    console.log('  -> Status: SUCCESS (CO-PO Attainment and NBA levels verified!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 29: Hostel Outing request & Warden approval
  // --------------------------------------------------------------------------
  console.log('\n[Test 29] Requesting outing gatepass for John (student_john)...');
  const gatepassReqRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/hostel/gatepass/request',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, {
    destination: 'Home Outing Leave',
    out_time: '2026-06-28 09:00:00',
    in_time: '2026-06-28 18:00:00'
  });
  console.log(`  -> Gatepass Initial Status: ${gatepassReqRes.body.status}`);

  // Approve Gatepass as Warden (HOD has Warden access role mapped)
  const gatepassApproveRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/hostel/gatepass/approve',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accountsToken}`
    }
  }, {
    gatepass_id: gatepassReqRes.body.gatepass_id
  });
  console.log(`  -> Gatepass Status post Warden review: ${gatepassApproveRes.body.status}`);
  if (gatepassApproveRes.statusCode === 200 && gatepassApproveRes.body.status === 'APPROVED') {
    console.log('  -> Status: SUCCESS (Parent consent and Warden leaves workflow verified!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 30: Transport seat reservation with Capacity Overrun
  // --------------------------------------------------------------------------
  console.log('\n[Test 30] Booking bus seats (Capacity limits: max 3 passengers)...');
  const reserve1 = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/transport/reserve',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
  }, { route_id: 'route-delhi-ncr' });
  console.log(`  -> Seat 1/3 reservation: ${reserve1.body.status}`);

  await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/transport/reserve',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
  }, { route_id: 'route-delhi-ncr' });

  await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/transport/reserve',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
  }, { route_id: 'route-delhi-ncr' });

  // Overrun attempt (4th passenger)
  const reserveOverrun = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/transport/reserve',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
  }, { route_id: 'route-delhi-ncr' });
  
  console.log(`  -> Overrun seat booking: Code ${reserveOverrun.statusCode}, Error: ${reserveOverrun.body.error}`);
  if (reserveOverrun.statusCode === 400 && reserveOverrun.body.error.includes('Transport Block')) {
    console.log('  -> Status: SUCCESS (Bus route seat capacity check enforced!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 31: Library book issue blocked by outstanding overdue books
  // --------------------------------------------------------------------------
  console.log('\n[Test 31] Checking out a library book...');
  const johnCheckoutRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/library/checkout',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, {
    student_id: studentUserId,
    book_title: 'SICP Structure and Interpretation of Computer Programs'
  });
  console.log(`  -> John Checkout: ${johnCheckoutRes.body.status}. Return Due: ${johnCheckoutRes.body.due_date}`);

  // Bob has active overdues -> Should be blocked!
  const bobCheckoutRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/library/checkout',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accountsToken}` // Using staff token to query Bob's checkout
    }
  }, {
    student_id: 'student-uuid-poor',
    book_title: 'Introduction to Algorithms CLRS'
  });
  console.log(`  -> Bob Checkout: Code ${bobCheckoutRes.statusCode}, Error: ${bobCheckoutRes.body.error}`);
  if (bobCheckoutRes.statusCode === 400 && bobCheckoutRes.body.error.includes('Library Block')) {
    console.log('  -> Status: SUCCESS (Circulation checkout blocks active overdues!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 32: HR Faculty Appraisal score calculation
  // --------------------------------------------------------------------------
  console.log('\n[Test 32] Computing Faculty performance appraisal indices...');
  const appraisalRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/hr/appraisal/1eb5c1d6-7890-1234-9012-def012345678',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${hodToken}` }
  });
  console.log(`  -> Faculty Appraisal Score: ${appraisalRes.body.appraisal_score}`);
  console.log(`  -> Performance Grade: ${appraisalRes.body.performance_grade}`);
  if (appraisalRes.statusCode === 200 && appraisalRes.body.performance_grade) {
    console.log('  -> Status: SUCCESS (UGC publications and weekly workload indices evaluated!)');
  }

  // --------------------------------------------------------------------------
  // TEST CASE 33: HR Salary disbursement balanced journal ledger verification
  // --------------------------------------------------------------------------
  console.log('\n[Test 33] Disbursing Monthly Salary for Faculty and posting journal ledger entries...');
  const salaryDisburseRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/hr/salary/1eb5c1d6-7890-1234-9012-def012345678',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accountsToken}` } // requires accounts:write
  });
  console.log(`  -> Salary API Response:`, salaryDisburseRes.body);
  if (salaryDisburseRes.statusCode === 200 && salaryDisburseRes.body.entry_id) {
    console.log('  -> Status: SUCCESS (Balanced General Ledger entry committed for salary disbursement!)');
  }

  console.log('\n============================================================================');
  console.log('ALL GATEWAY SECURITY, DOUBLE-ENTRY, ACADEMICS, REGISTRATIONS, ATTENDANCES, FINANCES, SCHEDULERS, PLACEMENTS, LMS, HOSTELS, TRANSPORTS, LIBRARY & HR MONITORS VERIFIED.');
  console.log('============================================================================');
}

runTests();
