-- ============================================================================
-- SUTRAOS DATABASE PRODUCTION SCHEMA (POSTGRESQL DIALECT)
-- Enterprise-Grade Multi-Tenant Schema with Double-Entry Ledger,
-- Temporal Course Versioning, and Cryptographic Grade Auditing.
-- ============================================================================

-- Enable Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. TENANCY & ORGANIZATIONAL CORE HIERARCHY
-- ============================================================================

CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trust_name VARCHAR(255) NOT NULL,
    registered_office_address TEXT,
    tax_identifier_pan VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institutions (
    institution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., MIT-ENG, MIT-MED
    regulatory_body VARCHAR(100),     -- e.g., UGC, AICTE, NMC
    accreditation_status JSONB,       -- e.g., {"NAAC": "A+", "NIRF_Rank": 45}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campuses (
    campus_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(institution_id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID NOT NULL REFERENCES campuses(campus_id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL, -- e.g., CSE, MECH, CARDIOLOGY
    hod_faculty_id UUID,        -- Added as circular reference mapped post-faculty table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (campus_id, code)
);

-- ============================================================================
-- 2. ACADEMIC CURRICULUM LAYERS
-- ============================================================================

CREATE TABLE programs (
    program_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,       -- e.g., Bachelor of Technology (Computer Science)
    code VARCHAR(20) NOT NULL,        -- e.g., BTECH-CSE
    duration_semesters INT NOT NULL CHECK (duration_semesters > 0),
    total_credits_required INT NOT NULL CHECK (total_credits_required > 0),
    nep_compliant BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE terms (
    term_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    academic_year VARCHAR(9) NOT NULL CHECK (academic_year ~ '^\d{4}-\d{4}$'), -- e.g., "2026-2027"
    term_number INT NOT NULL CHECK (term_number BETWEEN 1 AND 12),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    CONSTRAINT check_term_dates CHECK (start_date < end_date)
);

CREATE TABLE divisions (
    division_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID NOT NULL REFERENCES terms(term_id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    name VARCHAR(50) NOT NULL, -- e.g., "Section A", "Section B"
    room_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. USER MANAGEMENT & CREDENTIAL ENTITIES (Unified Demographic Database)
-- ============================================================================

CREATE TABLE user_accounts (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    system_role VARCHAR(50) NOT NULL CHECK (system_role IN (
        'SUPER_ADMIN', 'INSTITUTION_ADMIN', 'PRINCIPAL', 'REGISTRAR', 
        'EXAM_CONTROLLER', 'HOD', 'FACULTY', 'STUDENT', 'PARENT', 
        'LIBRARIAN', 'WARDEN', 'ACCOUNTS', 'PLACEMENT_OFFICER'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_accounts(user_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    date_of_birth DATE NOT NULL,
    aadhaar_number VARCHAR(12) UNIQUE CHECK (aadhaar_number ~ '^\d{12}$'),
    pan_number VARCHAR(10) UNIQUE,
    permanent_address TEXT NOT NULL,
    current_address TEXT NOT NULL,
    emergency_contact VARCHAR(100) NOT NULL
);

-- ============================================================================
-- 4. STUDENT & FACULTY ROLES
-- ============================================================================

CREATE TABLE faculty (
    faculty_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_accounts(user_id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE RESTRICT,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    designation VARCHAR(100) NOT NULL,
    qualification TEXT NOT NULL,
    net_set_qualified BOOLEAN DEFAULT FALSE,
    specialization TEXT[],
    biometric_id VARCHAR(50) UNIQUE,
    current_status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (current_status IN (
        'ONBOARDED', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RETIRED', 'RESIGNED'
    )),
    joining_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_accounts(user_id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    campus_id UUID NOT NULL REFERENCES campuses(campus_id) ON DELETE RESTRICT,
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE RESTRICT,
    division_id UUID NOT NULL REFERENCES divisions(division_id) ON DELETE RESTRICT,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    roll_number VARCHAR(50) UNIQUE,
    abc_id VARCHAR(12) UNIQUE CHECK (abc_id ~ '^\d{12}$'), -- Academic Bank of Credits ID
    enrollment_status VARCHAR(50) DEFAULT 'ENROLLED' CHECK (enrollment_status IN (
        'APPLICANT', 'ADMITTED', 'ENROLLED', 'ACTIVE', 'SUSPENDED', 
        'TERM_BREAK', 'GRADUATED', 'TERMINATED', 'ALUMNI'
    )),
    admission_year INT NOT NULL,
    mentor_faculty_id UUID REFERENCES faculty(faculty_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Map Circular FK reference on departments post-faculty definition
ALTER TABLE departments ADD CONSTRAINT fk_department_hod FOREIGN KEY (hod_faculty_id) REFERENCES faculty(faculty_id) ON DELETE SET NULL;

-- ============================================================================
-- 5. TEMPORAL CURRICULUM MODULE
-- ============================================================================

CREATE TABLE course_versions (
    course_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE RESTRICT,
    course_code VARCHAR(20) NOT NULL, -- Business key remains unchanged across syllabi
    course_name VARCHAR(255) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0),
    course_type VARCHAR(20) CHECK (course_type IN ('CORE', 'ELECTIVE', 'AUDIT', 'LAB')),
    version_number INT NOT NULL CHECK (version_number > 0),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE DEFAULT '9999-12-31 23:59:59+00'::timestamp with time zone,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, course_code, version_number)
);

-- ============================================================================
-- 6. ATTENDANCE & ACADEMIC TRANSITS
-- ============================================================================

CREATE TABLE student_attendance (
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    session_period INT NOT NULL CHECK (session_period BETWEEN 1 AND 10),
    course_version_id UUID NOT NULL REFERENCES course_versions(course_version_id) ON DELETE RESTRICT,
    marked_by_faculty_id UUID NOT NULL REFERENCES faculty(faculty_id) ON DELETE RESTRICT,
    status VARCHAR(10) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, date, session_period)
);

-- ============================================================================
-- 7. DOUBLE-ENTRY FINANCIAL MODULE (General Ledger System)
-- ============================================================================

CREATE TABLE chart_of_accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    account_code VARCHAR(50) NOT NULL, -- e.g., "1200" (Receivables), "3001" (Tuition Income)
    account_name VARCHAR(150) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    parent_account_id UUID REFERENCES chart_of_accounts(account_id),
    is_reconciled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, account_code)
);

CREATE TABLE fee_structures (
    fee_structure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE RESTRICT,
    term_number INT NOT NULL,
    fee_head VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    credit_account_id UUID NOT NULL REFERENCES chart_of_accounts(account_id) ON DELETE RESTRICT
);

CREATE TABLE journal_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    entry_date DATE NOT NULL,
    post_date DATE,
    reference_document VARCHAR(100), -- Matching criteria (invoice IDs, bank references)
    narration TEXT,
    posting_status VARCHAR(20) DEFAULT 'DRAFT' CHECK (posting_status IN ('DRAFT', 'POSTED', 'VOIDED')),
    created_by UUID NOT NULL REFERENCES user_accounts(user_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE general_ledger_lines (
    line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES journal_entries(entry_id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(account_id) ON DELETE RESTRICT,
    student_id UUID REFERENCES students(student_id) ON DELETE SET NULL, -- References sub-ledger student IDs
    faculty_id UUID REFERENCES faculty(faculty_id) ON DELETE SET NULL, -- References sub-ledger faculty payroll
    debit_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (debit_amount >= 0),
    credit_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (credit_amount >= 0),
    CONSTRAINT chk_debit_credit CHECK (debit_amount = 0 OR credit_amount = 0),
    CONSTRAINT chk_non_zero_entry CHECK (debit_amount > 0 OR credit_amount > 0)
);

-- ============================================================================
-- 8. EXAMINATION SECURITY & GRADING SYSTEMS
-- ============================================================================

CREATE TABLE exam_schedules (
    exam_schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES terms(term_id) ON DELETE RESTRICT,
    course_version_id UUID NOT NULL REFERENCES course_versions(course_version_id) ON DELETE RESTRICT,
    exam_date TIMESTAMP NOT NULL,
    exam_type VARCHAR(20) NOT NULL CHECK (exam_type IN ('CIE_MID', 'CIE_QUIZ', 'ESE_THEORY', 'ESE_PRACTICAL')),
    max_marks INT NOT NULL CHECK (max_marks > 0)
);

CREATE TABLE student_marks (
    mark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    exam_schedule_id UUID NOT NULL REFERENCES exam_schedules(exam_schedule_id) ON DELETE RESTRICT,
    marks_obtained NUMERIC(5,2) NOT NULL CHECK (marks_obtained >= 0),
    is_absent BOOLEAN DEFAULT FALSE,
    grading_officer_faculty_id UUID NOT NULL REFERENCES faculty(faculty_id) ON DELETE RESTRICT,
    verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'GRADED', 'MODERATED', 'APPROVED')),
    marks_integrity_hash CHAR(64) NOT NULL, -- SHA-256 HMAC hash verifying authenticity
    audit_trail_log JSONB, -- Append-only changes tracking history
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, exam_schedule_id)
);

CREATE TABLE relative_grading_moderations (
    moderation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    exam_schedule_id UUID NOT NULL UNIQUE REFERENCES exam_schedules(exam_schedule_id) ON DELETE RESTRICT,
    mean_marks NUMERIC(5,2) NOT NULL,
    std_dev NUMERIC(5,2) NOT NULL,
    scaling_factor NUMERIC(4,2) DEFAULT 1.00,
    moderator_faculty_id UUID NOT NULL REFERENCES faculty(faculty_id) ON DELETE RESTRICT,
    moderation_status VARCHAR(20) DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING', 'APPROVED')),
    moderation_comments TEXT,
    approval_timestamp TIMESTAMP WITH TIME ZONE
);

CREATE TABLE student_term_grades (
    grade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    course_version_id UUID NOT NULL REFERENCES course_versions(course_version_id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES terms(term_id) ON DELETE RESTRICT,
    total_cie_marks NUMERIC(5,2),
    total_ese_marks NUMERIC(5,2),
    aggregated_marks NUMERIC(5,2),
    z_score NUMERIC(5,2),
    grade_point INT NOT NULL CHECK (grade_point BETWEEN 0 AND 10),
    letter_grade VARCHAR(2) NOT NULL CHECK (letter_grade IN ('S', 'A', 'B', 'C', 'D', 'E', 'F')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, course_version_id, term_id)
);

-- ============================================================================
-- 9. CONCURRENCY ALLOCATIONS & SCHEDULER INTEGRATIONS
-- ============================================================================

CREATE TABLE inventory_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    resource_type VARCHAR(30) NOT NULL CHECK (resource_type IN ('ELECTIVE_COURSE', 'HOSTEL_ROOM')),
    resource_id UUID NOT NULL,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    allocation_status VARCHAR(20) DEFAULT 'RESERVED' CHECK (allocation_status IN ('RESERVED', 'CONFIRMED', 'EXPIRED')),
    lock_acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lock_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT check_lock_times CHECK (lock_acquired_at < lock_expires_at)
);

CREATE TABLE timetable_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT check_slot_times CHECK (start_time < end_time),
    UNIQUE (tenant_id, day_of_week, start_time, end_time)
);

CREATE TABLE timetable_constraints (
    constraint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    constraint_name VARCHAR(150) NOT NULL,
    constraint_type VARCHAR(10) DEFAULT 'HARD' CHECK (constraint_type IN ('HARD', 'SOFT')),
    weight INT DEFAULT 1 CHECK (weight >= 0),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE timetable_solutions (
    solution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES terms(term_id) ON DELETE RESTRICT,
    fitness_score_hard INT NOT NULL,
    fitness_score_soft INT NOT NULL,
    solution_status VARCHAR(20) DEFAULT 'DRAFT' CHECK (solution_status IN ('DRAFT', 'SOLVING', 'SOLVED', 'ACTIVE')),
    allocated_schedule JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. ADVANCED DATABASE PL/PGSQL TRIGGERS & FUNCTIONS
-- ============================================================================

-- A. Journal Balance Validation Trigger
CREATE OR REPLACE FUNCTION verify_journal_balance() 
RETURNS TRIGGER AS $$
DECLARE
    v_debit_sum NUMERIC(15,2);
    v_credit_sum NUMERIC(15,2);
BEGIN
    IF NEW.posting_status = 'POSTED' THEN
        SELECT COALESCE(SUM(debit_amount), 0.00), COALESCE(SUM(credit_amount), 0.00)
        INTO v_debit_sum, v_credit_sum
        FROM general_ledger_lines
        WHERE entry_id = NEW.entry_id;

        IF v_debit_sum = 0.00 AND v_credit_sum = 0.00 THEN
            RAISE EXCEPTION 'Transaction unbalance: Cannot post an empty journal entry.';
        END IF;

        IF v_debit_sum <> v_credit_sum THEN
            RAISE EXCEPTION 'Double-entry failure: Total debits (%) must equal total credits (%).', v_debit_sum, v_credit_sum;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verify_journal_balance
BEFORE UPDATE OF posting_status ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION verify_journal_balance();

-- B. Marks Immutability Trigger (Post Results Publication)
CREATE OR REPLACE FUNCTION verify_marks_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if marks are already locked/approved
    IF OLD.verification_status = 'APPROVED' THEN
        RAISE EXCEPTION 'Academic lock: Published grades are immutable. Initiate revaluation workflow instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verify_marks_immutability
BEFORE UPDATE ON student_marks
FOR EACH ROW
EXECUTE FUNCTION verify_marks_immutability();

-- C. Marks Integrity Verification Trigger
-- This generates a hash checking (student_id + schedule_id + grade + salt) on row updates
CREATE OR REPLACE FUNCTION audit_marks_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_system_salt VARCHAR(100) := 'SUTRAOS_CORE_GRADES_SALT_PROTECTED';
BEGIN
    NEW.marks_integrity_hash := encode(
        digest(
            concat(
                NEW.student_id::text, 
                NEW.exam_schedule_id::text, 
                NEW.marks_obtained::text, 
                v_system_salt
            ), 
            'sha256'
        ), 
        'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_marks_integrity
BEFORE INSERT OR UPDATE ON student_marks
FOR EACH ROW
EXECUTE FUNCTION audit_marks_integrity();

-- ============================================================================
-- 11. INDEXING FOR CONCURRENCY & TENANCY PERFORMANCE
-- ============================================================================

-- Tenancy Performance Indexes
CREATE INDEX idx_tenant_students ON students (tenant_id, enrollment_status);
CREATE INDEX idx_tenant_faculty ON faculty (tenant_id, current_status);

-- General Ledger Performance Indexes
CREATE INDEX idx_gl_lines_entry ON general_ledger_lines (entry_id);
CREATE INDEX idx_gl_lines_student ON general_ledger_lines (student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_gl_lines_account ON general_ledger_lines (account_id);
CREATE INDEX idx_journal_posting ON journal_entries (tenant_id, posting_status, entry_date);

-- Concurrency Locks Performance Indexes
CREATE INDEX idx_inv_allocations_active ON inventory_allocations (resource_id, allocation_status) 
WHERE allocation_status = 'RESERVED';

-- Database Audit log check queries optimization
CREATE INDEX idx_student_marks_integrity ON student_marks (exam_schedule_id, verification_status);
