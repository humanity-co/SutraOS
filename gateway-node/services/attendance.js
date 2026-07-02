/**
 * SUTRAOS ATTENDANCE GATE & EXAM ELIGIBILITY ENGINE
 * Enforces UGC-compliant 75% attendance criteria for ESE exams,
 * block/unblock hall-ticket algorithms, and condonation waiver pipelines.
 */

import { querySecure } from '../db.js';

// In-memory student attendance records simulator
const mockAttendanceLogs = {
  // student_john (Present: 16 sessions, Conducted: 20 sessions -> 80% attendance)
  '2fc6d2e7-8901-2345-0123-ef0123456789': {
    courses: {
      'CS101': { present: 16, total: 20 }
    },
    condonations: [] // List of approved waivers
  },
  // student_poor (Present: 12 sessions, Conducted: 20 sessions -> 60% attendance -> BLOCKED)
  'student-uuid-poor': {
    courses: {
      'CS101': { present: 12, total: 20 }
    },
    condonations: []
  }
};

/**
 * Calculates a student's course attendance summaries and determines examination eligibility.
 * 
 * @param {string} studentId - Student identifier
 * @returns {Object} Summarized attendance details per course
 */
export function getStudentAttendanceSummary(studentId) {
  const records = mockAttendanceLogs[studentId];
  if (!records) {
    throw new Error('No attendance history found for this student ID.');
  }

  const courseSummaries = Object.keys(records.courses).map(courseCode => {
    const data = records.courses[courseCode];
    const present = data.present;
    const total = data.total;
    
    // Calculate percentage
    const percentage = total > 0 ? (present / total) * 100 : 100;
    
    // Check if condonation has been approved for this course
    const condoned = records.condonations.includes(courseCode);
    
    // Enforce 75% UGC Gate (Pass if >=75% OR if condoned by administrative waiver)
    const isEligible = percentage >= 75.00 || condoned;

    return {
      course_code: courseCode,
      sessions_conducted: total,
      sessions_present: present,
      attendance_percentage: parseFloat(percentage.toFixed(2)),
      condonation_applied: condoned,
      exam_eligibility: isEligible ? 'ELIGIBLE' : 'BLOCKED'
    };
  });

  return {
    student_id: studentId,
    overall_eligible: courseSummaries.every(c => c.exam_eligibility === 'ELIGIBLE'),
    course_summaries: courseSummaries
  };
}

/**
 * Registers an administrative attendance condonation waiver (e.g. medical, sports quota).
 * Restricted to HOD / Exam Controller roles.
 * 
 * @param {string} studentId - Target Student
 * @param {string} courseCode - Target Course
 * @param {string} reason - Condonation metadata
 */
export function registerCondonationWaiver(studentId, courseCode, reason) {
  const records = mockAttendanceLogs[studentId];
  if (!records) {
    throw new Error('Student records not initialized.');
  }

  const data = records.courses[courseCode];
  if (!data) {
    throw new Error('Student is not registered in this course.');
  }

  // Double check if already eligible without waiver
  const percentage = (data.present / data.total) * 100;
  
  // Administrative limit: Condonation cannot be applied below 60% attendance under UGC regulations
  if (percentage < 60.00) {
    throw new Error(`Condonation Blocked: Attendance is ${percentage.toFixed(2)}% which falls below the absolute UGC threshold of 60.00% for waivers.`);
  }

  if (records.condonations.includes(courseCode)) {
    return { message: 'Condonation already active.' };
  }

  records.condonations.push(courseCode);
  console.log(`[Attendance Condonation] Applied administrative grace waiver for Student: ${studentId} on Course: ${courseCode}. Reason: ${reason}`);

  return {
    status: 'CONDONED',
    student_id: studentId,
    course_code: courseCode,
    reason: reason
  };
}
