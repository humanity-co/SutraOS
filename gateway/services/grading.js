/**
 * SUTRAOS RELATIVE GRADING & STATISTICAL ENGINE
 * Implements UGC-compliant cohort relative grading curves, Z-score calculations,
 * and HOD moderation scaling factors.
 */

/**
 * Calculates statistical relative grades for a student cohort.
 * 
 * @param {Array} studentMarksList - List of students and their raw marks (CIE + ESE)
 * @param {number} scalingFactor - Optional moderation scaling factor (default: 1.0)
 * @returns {Object} Calculated cohort statistics and student grade recommendations
 */
export function calculateCohortRelativeGrades(studentMarksList, scalingFactor = 1.00) {
  if (!studentMarksList || !Array.isArray(studentMarksList) || studentMarksList.length < 5) {
    throw new Error('Relative grading requires a minimum cohort of 5 students to execute curves.');
  }

  // 1. Filter out students who failed the minimum raw ESE pass mark (40% under UGC rules)
  // These students fail automatically (F) and are excluded from mean/std_dev calculation
  // to prevent skewing the curve for the passing cohort.
  const absoluteFails = studentMarksList.filter(s => s.raw_marks < 40.00);
  const eligibleCohort = studentMarksList.filter(s => s.raw_marks >= 40.00);

  // If nobody passed the absolute threshold
  if (eligibleCohort.length === 0) {
    return {
      mean: 0,
      stdDev: 0,
      studentGrades: studentMarksList.map(s => ({
        student_id: s.student_id,
        raw_marks: s.raw_marks,
        z_score: 0.00,
        letter_grade: 'F',
        grade_point: 0
      }))
    };
  }

  // 2. Compute Mean (μ) of eligible cohort
  const totalMarksSum = eligibleCohort.reduce((sum, s) => sum + s.raw_marks, 0);
  const mean = totalMarksSum / eligibleCohort.length;

  // 3. Compute Standard Deviation (σ)
  const squaredDifferencesSum = eligibleCohort.reduce((sum, s) => {
    return sum + Math.pow(s.raw_marks - mean, 2);
  }, 0);
  // Prevent division by zero if all scores are identical
  const variance = squaredDifferencesSum / eligibleCohort.length;
  const stdDev = variance > 0 ? Math.sqrt(variance) : 1.0;

  // 4. Calculate Z-Scores and map grades
  // Z = (Marks - Mean) / StdDev
  // Apply moderation scaling factor to the Z-score computation
  const studentGrades = studentMarksList.map(s => {
    // If student is an absolute fail
    if (s.raw_marks < 40.00) {
      return {
        student_id: s.student_id,
        raw_marks: s.raw_marks,
        z_score: null,
        letter_grade: 'F',
        grade_point: 0,
        moderated: false
      };
    }

    // Apply the scaling factor (moderation curve adjustments)
    const zScore = ((s.raw_marks - mean) / stdDev) * scalingFactor;
    
    // UGC Standard Relative Grading Scale:
    let letterGrade = 'F';
    let gradePoint = 0;

    if (zScore >= 1.50) {
      letterGrade = 'S'; // Outstanding
      gradePoint = 10;
    } else if (zScore >= 1.00 && zScore < 1.50) {
      letterGrade = 'A'; // Excellent
      gradePoint = 9;
    } else if (zScore >= 0.50 && zScore < 1.00) {
      letterGrade = 'B'; // Very Good
      gradePoint = 8;
    } else if (zScore >= 0.00 && zScore < 0.50) {
      letterGrade = 'C'; // Good
      gradePoint = 7;
    } else if (zScore >= -0.50 && zScore < 0.00) {
      letterGrade = 'D'; // Average
      gradePoint = 6;
    } else if (zScore >= -1.00 && zScore < -0.50) {
      letterGrade = 'E'; // Pass
      gradePoint = 5;
    } else {
      letterGrade = 'F'; // Fail
      gradePoint = 0;
    }

    return {
      student_id: s.student_id,
      raw_marks: s.raw_marks,
      z_score: parseFloat(zScore.toFixed(3)),
      letter_grade: letterGrade,
      grade_point: gradePoint,
      moderated: scalingFactor !== 1.00
    };
  });

  return {
    cohort_total: studentMarksList.length,
    graded_cohort: eligibleCohort.length,
    absolute_fails: absoluteFails.length,
    mean: parseFloat(mean.toFixed(2)),
    std_dev: parseFloat(stdDev.toFixed(2)),
    scaling_factor_applied: scalingFactor,
    student_grades: studentGrades
  };
}
