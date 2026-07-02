/**
 * SUTRAOS TIMETABLE CONSTRAINT & CONFLICT CHECKER ENGINE
 * Enforces room allocation sanity, student division time slot checks,
 * and faculty scheduling overlap exclusions.
 */

// In-memory timetable registry simulator
const mockTimetableRegistry = [
  {
    schedule_id: 'sched-uuid-001',
    course_version_id: '1ad5e1f6-7890-1234-f012-3456789abcde', // CS101
    faculty_id: '1eb5c1d6-7890-1234-9012-def012345678', // Faculty Anjali Verma
    division_id: '09b4d0e5-6789-0123-ef01-23456789abcd', // Section A
    room_number: 'Lab Block 3, Room 402',
    day_of_week: 1, // Monday
    start_time: '09:00:00',
    end_time: '09:55:00'
  }
];

/**
 * Checks if two time intervals overlap.
 * Format expected: "HH:MM:SS" (24-hour format)
 */
function isTimeOverlapping(startA, endA, startB, endB) {
  return (startA < endB) && (endA > startB);
}

/**
 * Validates a proposed timetable slot against active database constraints.
 * 
 * @param {Object} proposal - Proposed timetable slot layout
 * @returns {Object} Validation results detailing conflict reasons, if any
 */
export function validateTimetableSlot(proposal) {
  const { faculty_id, division_id, room_number, day_of_week, start_time, end_time } = proposal;

  if (!faculty_id || !division_id || !room_number || !day_of_week || !start_time || !end_time) {
    throw new Error('Proposed slot requires faculty_id, division_id, room_number, day_of_week, start_time, and end_time.');
  }

  // Scan registry for scheduling overlaps on the same day
  const dailySchedules = mockTimetableRegistry.filter(s => s.day_of_week === parseInt(day_of_week));

  for (const active of dailySchedules) {
    const overlapping = isTimeOverlapping(start_time, end_time, active.start_time, active.end_time);
    
    if (overlapping) {
      // Constraint 1: Faculty Clash (Teacher cannot be in two places at once)
      if (active.faculty_id === faculty_id) {
        return {
          valid: false,
          conflict_type: 'FACULTY_CLASH',
          message: `Scheduling Conflict: Teacher is already booked in room [${active.room_number}] from ${active.start_time} to ${active.end_time} on this day.`
        };
      }

      // Constraint 2: Division Clash (Student class cannot have two lectures at once)
      if (active.division_id === division_id) {
        return {
          valid: false,
          conflict_type: 'DIVISION_CLASH',
          message: `Scheduling Conflict: Student Division is already attending a course in room [${active.room_number}] from ${active.start_time} to ${active.end_time}.`
        };
      }

      // Constraint 3: Room Clash (Two courses cannot occupy the same physical room)
      if (active.room_number === room_number) {
        return {
          valid: false,
          conflict_type: 'ROOM_CLASH',
          message: `Scheduling Conflict: Classroom [${room_number}] is already occupied by Division [${active.division_id}] during this slot.`
        };
      }
    }
  }

  return {
    valid: true,
    message: 'Timetable slot matches all active hardware and resource constraints.'
  };
}

/**
 * Commits the validated slot to the active registry.
 */
export function addTimetableSlot(slot) {
  const check = validateTimetableSlot(slot);
  if (!check.valid) {
    throw new Error(check.message);
  }

  const schedule_id = Math.random().toString(36).substring(2, 15);
  const newSlot = { schedule_id, ...slot };
  mockTimetableRegistry.push(newSlot);

  console.log(`[Scheduler Engine] Registered Timetable Slot: Room ${slot.room_number}, Day ${slot.day_of_week}, ${slot.start_time}-${slot.end_time}`);
  
  return newSlot;
}
