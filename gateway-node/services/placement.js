/**
 * SUTRAOS PLACEMENT PORTAL & ELIGIBILITY ENGINE
 * Implements CGPA checks, backlog audits, and "Dream Company" package upgrade gates.
 */

// In-memory Job Drives registry simulator
const mockPlacementDrives = {
  'drive-google-uuid': {
    company_name: 'Google India',
    min_cgpa: 8.00,
    allow_backlogs: false,
    package_lpa: 30.00
  },
  'drive-infosys-uuid': {
    company_name: 'Infosys',
    min_cgpa: 6.00,
    allow_backlogs: true,
    package_lpa: 4.50
  },
  'drive-cred-uuid': {
    company_name: 'CRED',
    min_cgpa: 8.50,
    allow_backlogs: false,
    package_lpa: 15.00
  }
};

// In-memory student academic transcripts simulator for eligibility checks
const mockPlacementStudentHistory = {
  // student_john (CGPA: 8.5, backlogs: 0, current placement: none)
  '2fc6d2e7-8901-2345-0123-ef0123456789': {
    cgpa: 8.50,
    backlog_count: 0,
    placed_company: null,
    placed_package_lpa: 0.00
  },
  // student_poor (CGPA: 5.5, backlogs: 1, current placement: none)
  'student-uuid-poor': {
    cgpa: 5.50,
    backlog_count: 1,
    placed_company: null,
    placed_package_lpa: 0.00
  }
};

/**
 * Evaluates a student's eligibility for a placement drive.
 * 
 * @param {string} studentId - Student identifier
 * @param {string} driveId - Target placement drive
 * @returns {Object} Eligibility evaluation result with detailed blocks, if any
 */
export function checkPlacementEligibility(studentId, driveId) {
  const student = mockPlacementStudentHistory[studentId];
  const drive = mockPlacementDrives[driveId];

  if (!student || !drive) {
    throw new Error('Student or Job Drive records not found.');
  }

  // 1. CGPA Verification Gate
  if (student.cgpa < drive.min_cgpa) {
    return {
      eligible: false,
      block_reason: 'CGPA_INSIGNIFICANT',
      message: `Blocked: Your CGPA [${student.cgpa}] does not meet the minimum required CGPA of [${drive.min_cgpa}] for ${drive.company_name}.`
    };
  }

  // 2. Active Backlogs Gate
  if (!drive.allow_backlogs && student.backlog_count > 0) {
    return {
      eligible: false,
      block_reason: 'ACTIVE_BACKLOGS_FOUND',
      message: `Blocked: ${drive.company_name} does not permit candidates with active backlogs (Current: ${student.backlog_count}).`
    };
  }

  // 3. Dream Company Upgrade Gate (1.5x salary multiplier rule)
  // If student is already placed, they can only register for another drive if package is >= 1.5x current package
  if (student.placed_company) {
    const minRequiredPackage = student.placed_package_lpa * 1.50;
    if (drive.package_lpa < minRequiredPackage) {
      return {
        eligible: false,
        block_reason: 'DREAM_UPGRADE_LIMIT_REACHED',
        message: `Blocked: Already placed at [${student.placed_company}] with package ₹${student.placed_package_lpa} LPA. Dream upgrade rules require next drive to offer at least 1.5x current package (₹${minRequiredPackage.toFixed(2)} LPA). Proposing: ₹${drive.package_lpa} LPA.`
      };
    }
  }

  return {
    eligible: true,
    message: `Congratulations! You meet all corporate and academic eligibility criteria for ${drive.company_name}.`
  };
}

/**
 * Registers an eligible student for a placement drive, updates placement states.
 */
export function registerStudentForDrive(studentId, driveId) {
  const check = checkPlacementEligibility(studentId, driveId);
  if (!check.eligible) {
    throw new Error(check.message);
  }

  console.log(`[Placement Engine] Registered Student: ${studentId} for Drive: ${driveId}`);
  return { status: 'REGISTERED', student_id: studentId, drive_id: driveId };
}

/**
 * Simulates a student getting placed in a drive, updates their package status.
 */
export function recordJobOffer(studentId, companyName, packageLpa) {
  const student = mockPlacementStudentHistory[studentId];
  if (!student) {
    throw new Error('Student profile not found.');
  }

  student.placed_company = companyName;
  student.placed_package_lpa = parseFloat(packageLpa);
  
  console.log(`[Placement Engine] RECORDED JOB OFFER: Student ${studentId} placed at ${companyName} for ₹${packageLpa} LPA.`);
  return { status: 'PLACED', student_id: studentId, company_name: companyName, package_lpa: packageLpa };
}
