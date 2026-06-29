/**
 * SUTRAOS LMS & ACADEMIC OUTCOMES (CO-PO) ENGINE
 * Implements topic progress monitoring and NBA-compliant Course Outcome (CO)
 * to Program Outcome (PO) mapping statistics.
 */

// In-memory Course Outcomes mapping database
const mockCourseOutcomeMap = {
  '1ad5e1f6-7890-1234-f012-3456789abcde': { // CS101
    outcomes: {
      'CO1': { description: 'Understand basic programming constructs', mapped_pos: ['PO1', 'PO2'], weight: 3 },
      'CO2': { description: 'Design algorithmic solutions for sorting', mapped_pos: ['PO1', 'PO3'], weight: 2 },
      'CO3': { description: 'Write modular debugging code', mapped_pos: ['PO2', 'PO4'], weight: 3 }
    },
    syllabus_topics: [
      'Variables & Types', 'Control Flow', 'Arrays', 'Functions', 
      'Sorting Algorithms', 'Searching Algorithms', 'Debugging'
    ],
    completed_topics: ['Variables & Types', 'Control Flow', 'Arrays', 'Functions']
  }
};

/**
 * Calculates syllabus progress percentage.
 */
export function getSyllabusProgress(courseVersionId) {
  const course = mockCourseOutcomeMap[courseVersionId];
  if (!course) {
    throw new Error('Course version syllabus not configured.');
  }

  const total = course.syllabus_topics.length;
  const completed = course.completed_topics.length;
  const progress = total > 0 ? (completed / total) * 100 : 100;

  return {
    course_version_id: courseVersionId,
    total_topics: total,
    completed_topics: completed,
    progress_percentage: parseFloat(progress.toFixed(2))
  };
}

/**
 * Calculates CO-PO Attainment based on student exam mark sheets.
 * Mapped to NBA Criterion 3 requirements.
 * 
 * @param {string} courseVersionId - Course Version ID
 * @param {Array} studentGrades - Cohort grades array
 */
export function calculateCOPOAttainment(courseVersionId, studentGrades) {
  const course = mockCourseOutcomeMap[courseVersionId];
  if (!course) {
    throw new Error('Course metadata not configured.');
  }

  // Simulator for student performance mapping to outcomes
  // In production, marks are entered question-wise, where each question points to a specific CO.
  // We simulate mapping average cohort grade score to COs:
  const eligibleStudents = studentGrades.filter(s => s.letter_grade !== 'F');
  const cohortAverageGP = eligibleStudents.reduce((sum, s) => sum + s.grade_point, 0) / (eligibleStudents.length || 1);

  // NBA target threshold: Grade point average >= 6.0 (60% marks)
  const targetThresholdGP = 6.0;
  const attainmentLevel = cohortAverageGP >= targetThresholdGP ? 3 : cohortAverageGP >= 5.0 ? 2 : 1; 

  const coAttainments = Object.keys(course.outcomes).map(coKey => {
    const co = course.outcomes[coKey];
    return {
      outcome_code: coKey,
      description: co.description,
      target_attainment_level: 3,
      actual_attainment_level: attainmentLevel,
      attainment_percentage: parseFloat(((cohortAverageGP / 10) * 100).toFixed(2)),
      mapped_pos: co.mapped_pos
    };
  });

  // Calculate PO mappings
  const poAttainments = {};
  coAttainments.forEach(co => {
    co.mapped_pos.forEach(po => {
      if (!poAttainments[po]) {
        poAttainments[po] = [];
      }
      poAttainments[po].push(co.actual_attainment_level);
    });
  });

  const poSummary = Object.keys(poAttainments).map(poKey => {
    const levels = poAttainments[poKey];
    const averageLevel = levels.reduce((sum, l) => sum + l, 0) / levels.length;
    return {
      program_outcome_code: poKey,
      average_attainment_level: parseFloat(averageLevel.toFixed(2)),
      compliance_status: averageLevel >= 2.0 ? 'COMPLIANT' : 'UNDER_PERFORMING'
    };
  });

  return {
    course_version_id: courseVersionId,
    cohort_size: studentGrades.length,
    attainment_criteria: 'NBA_CRITERION_3',
    course_outcomes: coAttainments,
    program_outcomes: poSummary
  };
}
