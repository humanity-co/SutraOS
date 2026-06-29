/**
 * SUTRAOS ACADEMIC REGISTRATION & CONCURRENCY ENGINE
 * Implements prerequisite gates, credit limits verification, and pessimistic
 * seat reservation locks for elective courses.
 */

import { querySecure } from '../db.js';

// In-memory inventory simulator (active seats left for course allocations in mock environment)
const mockCourseInventory = {
  'course-adv-algorithms-uuid': {
    course_name: 'Advanced Algorithms',
    total_capacity: 5,
    reserved_seats: 0,
    confirmed_seats: 0,
    prerequisite_course_code: 'CS101'
  }
};

const mockStudentHistory = {
  // Student John Doe (student_john) has passed CS101 with credit
  '2fc6d2e7-8901-2345-0123-ef0123456789': {
    completed_courses: ['CS101'],
    total_term_credits: 22 // Current registered credits in semester
  },
  // Student Bob has NOT completed CS101
  'student-uuid-bob': {
    completed_courses: [],
    total_term_credits: 16
  }
};

/**
 * Attempts to reserve a seat in an elective course.
 * Operates with pessimistic checks for prerequisites, credit bounds, and capacity limits.
 * 
 * @param {string} studentId - Student identifier
 * @param {string} courseVersionId - Course Version identifier
 * @param {Object} context - Connection context for RLS
 */
export async function reserveElectiveSeat(studentId, courseVersionId, context) {
  // 1. Fetch Student History & Prerequisites
  const student = mockStudentHistory[studentId] || { completed_courses: [], total_term_credits: 0 };
  const course = mockCourseInventory[courseVersionId];

  if (!course) {
    throw new Error('Course offering not found or inactive.');
  }

  // 2. NEP-2020 Prerequisite Verification Gate
  const prereq = course.prerequisite_course_code;
  if (prereq && !student.completed_courses.includes(prereq)) {
    throw new Error(`Academic Block: Prerequisite course [${prereq}] not cleared.`);
  }

  // 3. Semester Credit Limits Verification (Max 26 credits under UGC regulations)
  const proposedCredits = student.total_term_credits + 4; // Course is 4 credits
  if (proposedCredits > 26) {
    throw new Error(`Credit Limit Block: Registration exceeds maximum limit of 26 credits (Current: ${student.total_term_credits}).`);
  }

  // 4. Pessimistic Concurrency Lock (Capacity check)
  // In real SQL, this executes: 
  // SELECT count(*) FROM inventory_allocations WHERE resource_id = $1 AND allocation_status = 'RESERVED' FOR UPDATE;
  const currentAllocationCount = course.reserved_seats + course.confirmed_seats;
  if (currentAllocationCount >= course.total_capacity) {
    throw new Error('Allocation Failure: Elective course is fully booked. Capacity exceeded.');
  }

  // Increment mock reservation lock count
  course.reserved_seats += 1;

  console.log(`[Pessimistic Locking] Seat reserved for Student: ${studentId} on Course: ${courseVersionId}. Lock expires in 10m.`);
  
  return {
    status: 'RESERVED',
    allocation_id: Math.random().toString(36).substring(2, 15),
    lock_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  };
}

/**
 * Confirms an active reservation seat booking.
 */
export async function confirmElectiveSeat(studentId, courseVersionId, allocationId) {
  const course = mockCourseInventory[courseVersionId];
  if (!course) {
    throw new Error('Invalid course reference.');
  }

  if (course.reserved_seats > 0) {
    course.reserved_seats -= 1;
    course.confirmed_seats += 1;
    console.log(`[Pessimistic Locking] Reservation confirmed for Student: ${studentId}. Seat allocated permanently.`);
    return { status: 'CONFIRMED' };
  } else {
    throw new Error('No active reservation lock found for this student and course.');
  }
}
