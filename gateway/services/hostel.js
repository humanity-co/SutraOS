/**
 * SUTRAOS HOSTEL WARDEN & OUTING GATEPASS ENGINE
 * Manages warden gatepass workflows, parental consent gates, and campus check-in logs.
 */

// In-memory gatepass logs
const mockGatepasses = {};

// In-memory student parental consent simulator
const mockParentalConsentList = {
  '2fc6d2e7-8901-2345-0123-ef0123456789': { parent_approved: true }, // John's parent approves leaves
  'student-uuid-poor': { parent_approved: false } // Bob's parent does not approve leaves
};

/**
 * Creates an outing gatepass request for a hostel student.
 */
export function requestOutingGatepass(studentId, destination, outTime, inTime) {
  const consent = mockParentalConsentList[studentId] || { parent_approved: false };
  
  const gatepassId = Math.random().toString(36).substring(2, 15);
  mockGatepasses[gatepassId] = {
    gatepass_id: gatepassId,
    student_id: studentId,
    destination: destination,
    out_time: outTime,
    in_time: inTime,
    parent_consent_approved: consent.parent_approved,
    warden_approved: false,
    status: consent.parent_approved ? 'PENDING_WARDEN_APPROVAL' : 'REJECTED_PARENT_CONSENT',
    created_at: new Date().toISOString()
  };

  console.log(`[Hostel Workflow] Outing Request: Student ${studentId} -> Destination: ${destination}. Consent: ${consent.parent_approved}`);

  return mockGatepasses[gatepassId];
}

/**
 * Warden reviews and approves a pending gatepass request.
 * Restricted to Warden role.
 */
export function approveGatepass(gatepassId, wardenFacultyId) {
  const pass = mockGatepasses[gatepassId];
  if (!pass) {
    throw new Error('Gatepass request not found.');
  }

  if (pass.status === 'REJECTED_PARENT_CONSENT') {
    throw new Error('Approval Blocked: Parental consent has been denied for this outing.');
  }

  pass.warden_approved = true;
  pass.status = 'APPROVED';
  pass.approved_by_warden_id = wardenFacultyId;
  
  console.log(`[Hostel Workflow] Gatepass ${gatepassId} APPROVED by Warden: ${wardenFacultyId}.`);

  return pass;
}
