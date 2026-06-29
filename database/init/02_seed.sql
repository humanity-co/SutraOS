-- ============================================================================
-- SUTRAOS DATABASE MOCK SEED DATA SCRIPT
-- Populates the Multi-Tenant structure, standard Chart of Accounts (COA),
-- basic Academic paths, and core test User Profiles.
-- ============================================================================

-- 1. Seed Educational Trust (Tenant)
INSERT INTO tenants (tenant_id, trust_name, registered_office_address, tax_identifier_pan)
VALUES (
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'Sutra Educational & Research Trust',
    '101, Knowledge Park, Sector 62, Noida, Uttar Pradesh, 201301',
    'AAATS1234F'
);

-- 2. Seed Institution
INSERT INTO institutions (institution_id, tenant_id, name, code, regulatory_body, accreditation_status)
VALUES (
    'b4c9e5f0-1234-5678-9abc-def012345678',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'Sutra Institute of Technology',
    'SIT-ENG',
    'AICTE',
    '{"NAAC": "A+", "NIRF_2025_Rank": 42, "NBA_Accredited": true}'
);

-- 3. Seed Campus
INSERT INTO campuses (campus_id, institution_id, tenant_id, name, address)
VALUES (
    'c5d0f6a1-2345-6789-abcd-ef0123456789',
    'b4c9e5f0-1234-5678-9abc-def012345678',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'Sutra Delhi-NCR Campus',
    'Knowledge Park III, Greater Noida, UP'
);

-- 4. Seed Department
INSERT INTO departments (department_id, campus_id, tenant_id, name, code)
VALUES (
    'd6e1a7b2-3456-7890-bcde-f0123456789a',
    'c5d0f6a1-2345-6789-abcd-ef0123456789',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'Computer Science & Engineering',
    'CSE'
);

-- 5. Seed Academic Program
INSERT INTO programs (program_id, department_id, tenant_id, name, code, duration_semesters, total_credits_required, nep_compliant)
VALUES (
    'e7f2b8c3-4567-8901-cdef-0123456789ab',
    'd6e1a7b2-3456-7890-bcde-f0123456789a',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'Bachelor of Technology in Computer Science',
    'BTECH-CSE',
    8,
    160,
    TRUE
);

-- 6. Seed Academic Term (Semester 1)
INSERT INTO terms (term_id, program_id, tenant_id, academic_year, term_number, start_date, end_date, is_active)
VALUES (
    'f8a3c9d4-5678-9012-def0-123456789abc',
    'e7f2b8c3-4567-8901-cdef-0123456789ab',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    '2026-2027',
    1,
    '2026-07-01',
    '2026-12-15',
    TRUE
);

-- 7. Seed Division
INSERT INTO divisions (division_id, term_id, tenant_id, name, room_number)
VALUES (
    '09b4d0e5-6789-0123-ef01-23456789abcd',
    'f8a3c9d4-5678-9012-def0-123456789abc',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'B.Tech CSE Section A',
    'Lab Block 3, Room 402'
);

-- 8. Seed Course (Temporal Version 1)
INSERT INTO course_versions (course_version_id, tenant_id, program_id, course_code, course_name, credits, course_type, version_number, valid_from)
VALUES (
    '1ad5e1f6-7890-1234-f012-3456789abcde',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'e7f2b8c3-4567-8901-cdef-0123456789ab',
    'CS101',
    'Introduction to Programming & Algorithms',
    4,
    'CORE',
    1,
    '2026-06-01 00:00:00+00'
);

-- ============================================================================
-- 9. SEED STANDARD CHART OF ACCOUNTS (COA)
-- ============================================================================

-- A. Asset Account: Cash/Bank
INSERT INTO chart_of_accounts (account_id, tenant_id, account_code, account_name, account_type)
VALUES (
    '2be6f2a7-8901-2345-0123-456789abcdef',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    '1001',
    'Cash / HDFC Bank Main Operating Account',
    'ASSET'
);

-- B. Asset Account: Student Receivables
INSERT INTO chart_of_accounts (account_id, tenant_id, account_code, account_name, account_type)
VALUES (
    '3cf7a3b8-9012-3456-1234-56789abcde01',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    '1200',
    'Student Tuition Fee Receivables Sub-ledger',
    'ASSET'
);

-- C. Liability Account: Deferred Tuition Revenue
INSERT INTO chart_of_accounts (account_id, tenant_id, account_code, account_name, account_type)
VALUES (
    '4dg8b4c9-0123-4567-2345-6789abcde012',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    '2001',
    'Unearned/Deferred Tuition Revenue Liability',
    'LIABILITY'
);

-- D. Revenue Account: Recognized Tuition Fee Revenue
INSERT INTO chart_of_accounts (account_id, tenant_id, account_code, account_name, account_type)
VALUES (
    '5eh9c5d0-1234-5678-3456-789abcde0123',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    '3001',
    'Tuition Fee Recognized Earnings',
    'REVENUE'
);

-- E. Expense Account: Faculty Salary Expenses
INSERT INTO chart_of_accounts (account_id, tenant_id, account_code, account_name, account_type)
VALUES (
    '6fi0d6e1-2345-6789-4567-89abcde01234',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    '4001',
    'Faculty and Staff Salary Expenses',
    'EXPENSE'
);

-- ============================================================================
-- 10. SEED CORE TEST USER ACCOUNTS & PROFILES (Passwords hashed: 'pbkdf2_sha256$...')
-- ============================================================================

-- A. Accounts Head User
INSERT INTO user_accounts (user_id, tenant_id, username, password_hash, email, phone_number, system_role)
VALUES (
    '7ad1e7f2-3456-7890-5678-9abcdef01234',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'accounts_head',
    '$2b$12$Zp4Z.R7b8t2w1M0D3w1G.O7X5r8Q.H5l1m3p4v8a2d1e0f7g8h9i0', -- Dummy bcrypt hash
    'accounts.head@sutraos.edu.in',
    '+919876543210',
    'ACCOUNTS'
);
INSERT INTO user_profiles (profile_id, user_id, first_name, last_name, gender, date_of_birth, aadhaar_number, permanent_address, current_address, emergency_contact)
VALUES (
    '8be2f8a3-4567-8901-6789-abcdef012345',
    '7ad1e7f2-3456-7890-5678-9abcdef01234',
    'Raman',
    'Sharma',
    'MALE',
    '1980-05-15',
    '123456789012',
    'Flat 402, Sector 15, Noida, UP',
    'Flat 402, Sector 15, Noida, UP',
    '+919876543211'
);

-- B. Faculty User (Teacher & Class Advisor)
INSERT INTO user_accounts (user_id, tenant_id, username, password_hash, email, phone_number, system_role)
VALUES (
    '9cf3a9b4-5678-9012-7890-bcdef0123456',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'faculty_teacher',
    '$2b$12$Zp4Z.R7b8t2w1M0D3w1G.O7X5r8Q.H5l1m3p4v8a2d1e0f7g8h9i0',
    'teacher.cse@sutraos.edu.in',
    '+919876543220',
    'FACULTY'
);
INSERT INTO user_profiles (profile_id, user_id, first_name, last_name, gender, date_of_birth, aadhaar_number, permanent_address, current_address, emergency_contact)
VALUES (
    '0da4b0c5-6789-0123-8901-cdef01234567',
    '9cf3a9b4-5678-9012-7890-bcdef0123456',
    'Anjali',
    'Verma',
    'FEMALE',
    '1985-08-22',
    '234567890123',
    'B-12, Green Park, South Delhi, Delhi',
    'B-12, Green Park, South Delhi, Delhi',
    '+919876543221'
);
INSERT INTO faculty (faculty_id, user_id, tenant_id, department_id, employee_code, designation, qualification, net_set_qualified, joining_date)
VALUES (
    '1eb5c1d6-7890-1234-9012-def012345678',
    '9cf3a9b4-5678-9012-7890-bcdef0123456',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'd6e1a7b2-3456-7890-bcde-f0123456789a',
    'EMP-CSE-001',
    'Assistant Professor',
    'PhD in Computer Science',
    TRUE,
    '2021-01-10'
);

-- C. Student User
INSERT INTO user_accounts (user_id, tenant_id, username, password_hash, email, phone_number, system_role)
VALUES (
    '2fc6d2e7-8901-2345-0123-ef0123456789',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'student_john',
    '$2b$12$Zp4Z.R7b8t2w1M0D3w1G.O7X5r8Q.H5l1m3p4v8a2d1e0f7g8h9i0',
    'john.doe@sutraos.edu.in',
    '+919876543230',
    'STUDENT'
);
INSERT INTO user_profiles (profile_id, user_id, first_name, last_name, gender, date_of_birth, aadhaar_number, permanent_address, current_address, emergency_contact)
VALUES (
    '3ad7e3f8-9012-3456-1234-f0123456789a',
    '2fc6d2e7-8901-2345-0123-ef0123456789',
    'John',
    'Doe',
    'MALE',
    '2006-11-05',
    '345678901234',
    'Flat C-1, Sector 62, Noida, UP',
    'Hostel Room 102, SIT NCR Campus, Greater Noida, UP',
    '+919876543231'
);
INSERT INTO students (student_id, user_id, tenant_id, campus_id, program_id, division_id, admission_number, roll_number, abc_id, enrollment_status, admission_year, mentor_faculty_id)
VALUES (
    '4be8f4a9-0123-4567-2345-0123456789ab',
    '2fc6d2e7-8901-2345-0123-ef0123456789',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'c5d0f6a1-2345-6789-abcd-ef0123456789',
    'e7f2b8c3-4567-8901-cdef-0123456789ab',
    '09b4d0e5-6789-0123-ef01-23456789abcd',
    'ADM-2026-CSE-001',
    '26BCE001',
    '123456789012',
    'ACTIVE',
    2026,
    '1eb5c1d6-7890-1234-9012-def012345678'
);

-- D. Exam Controller User
INSERT INTO user_accounts (user_id, tenant_id, username, password_hash, email, phone_number, system_role)
VALUES (
    '5cf9e5f0-1234-5678-3456-123456789abc',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'exam_controller',
    '$2b$12$Zp4Z.R7b8t2w1M0D3w1G.O7X5r8Q.H5l1m3p4v8a2d1e0f7g8h9i0',
    'exam.controller@sutraos.edu.in',
    '+919876543240',
    'EXAM_CONTROLLER'
);
INSERT INTO user_profiles (profile_id, user_id, first_name, last_name, gender, date_of_birth, aadhaar_number, permanent_address, current_address, emergency_contact)
VALUES (
    '6da0a1b2-2345-6789-4567-23456789abcd',
    '5cf9e5f0-1234-5678-3456-123456789abc',
    'Vinod',
    'Mishra',
    'MALE',
    '1972-03-10',
    '456789012345',
    'C-88, Indirapuram, Ghaziabad, UP',
    'C-88, Indirapuram, Ghaziabad, UP',
    '+919876543241'
);

-- E. HOD CSE User
INSERT INTO user_accounts (user_id, tenant_id, username, password_hash, email, phone_number, system_role)
VALUES (
    '7eb1b2c3-3456-7890-5678-3456789abcde',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'hod_cse',
    '$2b$12$Zp4Z.R7b8t2w1M0D3w1G.O7X5r8Q.H5l1m3p4v8a2d1e0f7g8h9i0',
    'hod.cse@sutraos.edu.in',
    '+919876543250',
    'HOD'
);
INSERT INTO user_profiles (profile_id, user_id, first_name, last_name, gender, date_of_birth, aadhaar_number, permanent_address, current_address, emergency_contact)
VALUES (
    '8fc2c3d4-4567-8901-6789-456789abcdef',
    '7eb1b2c3-3456-7890-5678-3456789abcde',
    'Sanjay',
    'Gupta',
    'MALE',
    '1978-12-05',
    '567890123456',
    'F-90, Mayur Vihar, Delhi',
    'F-90, Mayur Vihar, Delhi',
    '+919876543251'
);
INSERT INTO faculty (faculty_id, user_id, tenant_id, department_id, employee_code, designation, qualification, net_set_qualified, joining_date)
VALUES (
    '9ad3d4e5-5678-9012-7890-56789abcdef0',
    '7eb1b2c3-3456-7890-5678-3456789abcde',
    'a3b8d4e9-0123-4567-89ab-cdef01234567',
    'd6e1a7b2-3456-7890-bcde-f0123456789a',
    'EMP-CSE-HOD',
    'Professor & HOD',
    'PhD in Computer Engineering',
    TRUE,
    '2015-06-15'
);

-- Set newly seeded Professor Sanjay Gupta as the actual HOD in departments table
UPDATE departments SET hod_faculty_id = '9ad3d4e5-5678-9012-7890-56789abcdef0' WHERE department_id = 'd6e1a7b2-3456-7890-bcde-f0123456789a';
