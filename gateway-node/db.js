import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connection Pool to PostgreSQL container
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sutraos_db',
  user: process.env.DB_USER || 'sutraos_admin',
  password: process.env.DB_PASSWORD || 'sutraos_secure_pass123',
  max: 20,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 1000
});

// ============================================================================
// CONSTANTS
// ============================================================================
const TENANT_ID = 'a3b8d4e9-0123-4567-89ab-cdef01234567';
const PASSWORD_HASH = '$2b$12$Zp4Z.R7b8t2w1M0D3w1G.O7X5r8Q.H5l1m3p4v8a2d1e0f7g8h9i0';

const DEPT_IDS = {
  CSE: 'dept-cse-uuid-001',
  ME:  'dept-me-uuid-002',
  CE:  'dept-ce-uuid-003',
  ECE: 'dept-ece-uuid-004',
  PPE: 'dept-ppe-uuid-005',
  AIDS: 'dept-aids-uuid-006',
  CSD: 'dept-csd-uuid-007',
  MBA: 'dept-mba-uuid-008',
  BSH: 'dept-bsh-uuid-009'
};

// ============================================================================
// DEPARTMENT DATA
// ============================================================================
const mockDepartments = [
  { department_id: DEPT_IDS.CSE, tenant_id: TENANT_ID, code: 'CSE', name: 'Computer Science & Engineering', hod_user_id: 'hod-cse-uuid-010', established_year: 1983, intake_capacity: 180 },
  { department_id: DEPT_IDS.ME,  tenant_id: TENANT_ID, code: 'ME',  name: 'Mechanical Engineering', hod_user_id: 'hod-me-uuid-011', established_year: 1983, intake_capacity: 120 },
  { department_id: DEPT_IDS.CE,  tenant_id: TENANT_ID, code: 'CE',  name: 'Civil Engineering', hod_user_id: 'hod-ce-uuid-012', established_year: 1983, intake_capacity: 60 },
  { department_id: DEPT_IDS.ECE, tenant_id: TENANT_ID, code: 'ECE', name: 'Electronics & Communication Engineering', hod_user_id: 'hod-ece-uuid-013', established_year: 1990, intake_capacity: 120 },
  { department_id: DEPT_IDS.PPE, tenant_id: TENANT_ID, code: 'PPE', name: 'Production & Industrial Engineering', hod_user_id: 'hod-ppe-uuid-014', established_year: 1983, intake_capacity: 60 },
  { department_id: DEPT_IDS.AIDS, tenant_id: TENANT_ID, code: 'AIDS', name: 'Artificial Intelligence & Data Science', hod_user_id: 'hod-aids-uuid-015', established_year: 2020, intake_capacity: 60 },
  { department_id: DEPT_IDS.CSD, tenant_id: TENANT_ID, code: 'CSD', name: 'Computer Science & Design', hod_user_id: 'hod-csd-uuid-016', established_year: 2021, intake_capacity: 60 },
  { department_id: DEPT_IDS.MBA, tenant_id: TENANT_ID, code: 'MBA', name: 'Master of Business Administration', hod_user_id: 'hod-mba-uuid-017', established_year: 2004, intake_capacity: 120 },
  { department_id: DEPT_IDS.BSH, tenant_id: TENANT_ID, code: 'BSH', name: 'Basic Sciences & Humanities', hod_user_id: 'hod-bsh-uuid-018', established_year: 1983, intake_capacity: null }
];

// ============================================================================
// IN-MEMORY DATABASE MOCK FALLBACK (If PostgreSQL is not running)
// ============================================================================

// ---------------------------------------------------------------------------
// Administrative Users (7)
// ---------------------------------------------------------------------------
const adminUsers = [
  {
    user_id: 'super-admin-uuid-000',
    tenant_id: TENANT_ID,
    username: 'super_admin',
    password_hash: PASSWORD_HASH,
    system_role: 'SUPER_ADMIN',
    first_name: 'System',
    last_name: 'Administrator',
    department_id: null,
    department_code: null
  },
  {
    user_id: 'inst-admin-uuid-001',
    tenant_id: TENANT_ID,
    username: 'inst_admin',
    password_hash: PASSWORD_HASH,
    system_role: 'INSTITUTION_ADMIN',
    first_name: 'MIT',
    last_name: 'Admin',
    department_id: null,
    department_code: null
  },
  {
    user_id: 'principal-uuid-002',
    tenant_id: TENANT_ID,
    username: 'principal',
    password_hash: PASSWORD_HASH,
    system_role: 'PRINCIPAL',
    first_name: 'Dr. Nilesh',
    last_name: 'Patil',
    department_id: DEPT_IDS.ME,
    department_code: 'ME'
  },
  {
    user_id: 'registrar-uuid-003',
    tenant_id: TENANT_ID,
    username: 'registrar',
    password_hash: PASSWORD_HASH,
    system_role: 'REGISTRAR',
    first_name: 'Sachin',
    last_name: 'Lomte',
    department_id: null,
    department_code: null
  },
  {
    user_id: 'exam-ctrl-uuid-004',
    tenant_id: TENANT_ID,
    username: 'exam_controller',
    password_hash: PASSWORD_HASH,
    system_role: 'EXAM_CONTROLLER',
    first_name: 'Dr. Ganesh',
    last_name: 'Sable',
    department_id: DEPT_IDS.ECE,
    department_code: 'ECE'
  },
  {
    user_id: 'accounts-uuid-005',
    tenant_id: TENANT_ID,
    username: 'accounts_head',
    password_hash: PASSWORD_HASH,
    system_role: 'ACCOUNTS',
    first_name: 'Rajesh',
    last_name: 'Kulkarni',
    department_id: null,
    department_code: null
  },
  {
    user_id: 'placement-uuid-006',
    tenant_id: TENANT_ID,
    username: 'placement_officer',
    password_hash: PASSWORD_HASH,
    system_role: 'PLACEMENT_OFFICER',
    first_name: 'Sandeep',
    last_name: 'Pankade',
    department_id: DEPT_IDS.ME,
    department_code: 'ME'
  }
];

// ---------------------------------------------------------------------------
// HOD Users (9 — one per department)
// ---------------------------------------------------------------------------
const hodUsers = [
  { user_id: 'hod-cse-uuid-010', username: 'hod_cse', first_name: 'Prof. Bhupesh', last_name: 'Mishra', department_id: DEPT_IDS.CSE, department_code: 'CSE' },
  { user_id: 'hod-me-uuid-011',  username: 'hod_me',  first_name: 'Dr. Pankaj',    last_name: 'Zine',   department_id: DEPT_IDS.ME,  department_code: 'ME' },
  { user_id: 'hod-ce-uuid-012',  username: 'hod_ce',  first_name: 'Dr. Manish',    last_name: 'Dixit',  department_id: DEPT_IDS.CE,  department_code: 'CE' },
  { user_id: 'hod-ece-uuid-013', username: 'hod_ece', first_name: 'Dr. Shilpa',    last_name: 'Kodgire',department_id: DEPT_IDS.ECE, department_code: 'ECE' },
  { user_id: 'hod-ppe-uuid-014', username: 'hod_ppe', first_name: 'Dr. Aniruddha', last_name: 'Chatterjee', department_id: DEPT_IDS.PPE, department_code: 'PPE' },
  { user_id: 'hod-aids-uuid-015',username: 'hod_aids',first_name: 'Dr. Saurabh',   last_name: 'Deshmukh',department_id: DEPT_IDS.AIDS,department_code: 'AIDS' },
  { user_id: 'hod-bsh-uuid-018', username: 'hod_bsh', first_name: 'Dr. A. C.',     last_name: 'Dabhole', department_id: DEPT_IDS.BSH, department_code: 'BSH' },
  { user_id: 'hod-mba-uuid-017', username: 'hod_mba', first_name: 'Dr. Prashant',  last_name: 'Mahajan', department_id: DEPT_IDS.MBA, department_code: 'MBA' },
  { user_id: 'hod-csd-uuid-016', username: 'hod_csd', first_name: 'Dr. Smita',     last_name: 'Kasar',  department_id: DEPT_IDS.CSD, department_code: 'CSD' }
].map(h => ({ ...h, tenant_id: TENANT_ID, password_hash: PASSWORD_HASH, system_role: 'HOD' }));

// ---------------------------------------------------------------------------
// Faculty Users (25 across departments)
// ---------------------------------------------------------------------------
const facultyDefinitions = [
  // CSE (5)
  { idx: '020', username: 'fac_cse_01', first_name: 'Dr. Rahul',    last_name: 'Deshmukh',   dept: 'CSE', designation: 'Associate Professor', specialization: 'Machine Learning' },
  { idx: '021', username: 'fac_cse_02', first_name: 'Prof. Sneha',  last_name: 'Jadhav',     dept: 'CSE', designation: 'Assistant Professor', specialization: 'Data Structures' },
  { idx: '022', username: 'fac_cse_03', first_name: 'Dr. Vikram',   last_name: 'Shinde',     dept: 'CSE', designation: 'Professor', specialization: 'Cloud Computing' },
  { idx: '023', username: 'fac_cse_04', first_name: 'Prof. Priya',  last_name: 'Kulkarni',   dept: 'CSE', designation: 'Assistant Professor', specialization: 'Cybersecurity' },
  { idx: '024', username: 'fac_cse_05', first_name: 'Dr. Amol',     last_name: 'Gaikwad',    dept: 'CSE', designation: 'Associate Professor', specialization: 'Computer Networks' },
  // ME (3)
  { idx: '025', username: 'fac_me_01',  first_name: 'Dr. Suresh',   last_name: 'Borse',      dept: 'ME', designation: 'Professor', specialization: 'Thermal Engineering' },
  { idx: '026', username: 'fac_me_02',  first_name: 'Prof. Dipak',  last_name: 'Patil',      dept: 'ME', designation: 'Assistant Professor', specialization: 'CAD/CAM' },
  { idx: '027', username: 'fac_me_03',  first_name: 'Dr. Manoj',    last_name: 'Khedkar',    dept: 'ME', designation: 'Associate Professor', specialization: 'Manufacturing Processes' },
  // CE (3)
  { idx: '028', username: 'fac_ce_01',  first_name: 'Dr. Swapnil',  last_name: 'Pawar',      dept: 'CE', designation: 'Associate Professor', specialization: 'Structural Engineering' },
  { idx: '029', username: 'fac_ce_02',  first_name: 'Prof. Renuka', last_name: 'Shegaonkar', dept: 'CE', designation: 'Assistant Professor', specialization: 'Environmental Engineering' },
  { idx: '030', username: 'fac_ce_03',  first_name: 'Dr. Nagesh',   last_name: 'Waghmare',   dept: 'CE', designation: 'Professor', specialization: 'Geotechnical Engineering' },
  // ECE (3)
  { idx: '031', username: 'fac_ece_01', first_name: 'Dr. Ashwini',  last_name: 'Sarode',     dept: 'ECE', designation: 'Associate Professor', specialization: 'VLSI Design' },
  { idx: '032', username: 'fac_ece_02', first_name: 'Prof. Sachin', last_name: 'Jagtap',     dept: 'ECE', designation: 'Assistant Professor', specialization: 'Embedded Systems' },
  { idx: '033', username: 'fac_ece_03', first_name: 'Dr. Megha',    last_name: 'Bhushan',    dept: 'ECE', designation: 'Professor', specialization: 'Signal Processing' },
  // PPE (2)
  { idx: '034', username: 'fac_ppe_01', first_name: 'Dr. Rajendra', last_name: 'Gawande',    dept: 'PPE', designation: 'Associate Professor', specialization: 'Industrial Automation' },
  { idx: '035', username: 'fac_ppe_02', first_name: 'Prof. Sagar',  last_name: 'Wankhede',   dept: 'PPE', designation: 'Assistant Professor', specialization: 'Quality Engineering' },
  // AIDS (2)
  { idx: '036', username: 'fac_aids_01',first_name: 'Dr. Prashant', last_name: 'More',       dept: 'AIDS', designation: 'Associate Professor', specialization: 'Deep Learning' },
  { idx: '037', username: 'fac_aids_02',first_name: 'Prof. Tanvi',  last_name: 'Deshpande',  dept: 'AIDS', designation: 'Assistant Professor', specialization: 'Big Data Analytics' },
  // CSD (2)
  { idx: '038', username: 'fac_csd_01', first_name: 'Dr. Rohan',   last_name: 'Bhagat',     dept: 'CSD', designation: 'Associate Professor', specialization: 'UI/UX Design' },
  { idx: '039', username: 'fac_csd_02', first_name: 'Prof. Neha',  last_name: 'Chandak',    dept: 'CSD', designation: 'Assistant Professor', specialization: 'Human-Computer Interaction' },
  // MBA (3)
  { idx: '040', username: 'fac_mba_01', first_name: 'Dr. Aarti',    last_name: 'Gokhale',    dept: 'MBA', designation: 'Professor', specialization: 'Strategic Management' },
  { idx: '041', username: 'fac_mba_02', first_name: 'Prof. Nikhil', last_name: 'Deshpande',  dept: 'MBA', designation: 'Assistant Professor', specialization: 'Finance & Accounting' },
  { idx: '042', username: 'fac_mba_03', first_name: 'Dr. Kavita',   last_name: 'Joshi',      dept: 'MBA', designation: 'Associate Professor', specialization: 'Marketing Management' },
  // BSH (2)
  { idx: '043', username: 'fac_bsh_01', first_name: 'Dr. Sunita',   last_name: 'Gavhane',    dept: 'BSH', designation: 'Professor', specialization: 'Applied Mathematics' },
  { idx: '044', username: 'fac_bsh_02', first_name: 'Prof. Vinay',  last_name: 'Bhosale',    dept: 'BSH', designation: 'Assistant Professor', specialization: 'Engineering Physics' }
];

const facultyUsers = facultyDefinitions.map(f => ({
  user_id: `fac-uuid-${f.idx}`,
  tenant_id: TENANT_ID,
  username: f.username,
  password_hash: PASSWORD_HASH,
  system_role: 'FACULTY',
  first_name: f.first_name,
  last_name: f.last_name,
  department_id: DEPT_IDS[f.dept],
  department_code: f.dept
}));

// ---------------------------------------------------------------------------
// Student Users (100 across departments)
// ---------------------------------------------------------------------------
const DEPT_CODES = ['CSE', 'ME', 'CE', 'ECE', 'PPE', 'AIDS', 'CSD', 'MBA', 'BSH'];
const DEPT_STUDENT_DIST = { CSE: 18, ME: 14, CE: 8, ECE: 14, PPE: 7, AIDS: 10, CSD: 10, MBA: 12, BSH: 7 };

const indianFirstNames = [
  'Aarav', 'Aditi', 'Akash', 'Ananya', 'Arjun', 'Bhavya', 'Chirag', 'Disha', 'Esha', 'Farhan',
  'Gauri', 'Harsh', 'Isha', 'Jay', 'Kavya', 'Lakshmi', 'Manav', 'Nandini', 'Om', 'Pooja',
  'Raj', 'Sanya', 'Tanmay', 'Uma', 'Varun', 'Wafa', 'Yash', 'Zoya', 'Aditya', 'Bhumi',
  'Chetan', 'Deepa', 'Eshwar', 'Falguni', 'Gaurav', 'Hema', 'Ishan', 'Jaya', 'Kiran', 'Lata',
  'Mohit', 'Neha', 'Omkar', 'Pallavi', 'Rahul', 'Sakshi', 'Tushar', 'Ujjwal', 'Vivek', 'Yogita',
  'Aniket', 'Bhakti', 'Chinmay', 'Devika', 'Ekta', 'Farida', 'Girish', 'Harsha', 'Indira', 'Jagdish',
  'Komal', 'Lalit', 'Meera', 'Nitin', 'Ojas', 'Pratik', 'Rupal', 'Siddharth', 'Tejas', 'Urmi',
  'Vineet', 'Wasim', 'Yatin', 'Zara', 'Abhishek', 'Barkha', 'Chandni', 'Dhruv', 'Eesha', 'Firoz',
  'Govind', 'Himani', 'Ira', 'Jayant', 'Kriti', 'Lavanya', 'Mayank', 'Nikita', 'Onkar', 'Payal',
  'Ritesh', 'Shreya', 'Tara', 'Uday', 'Vandana', 'Wahid', 'Yukta', 'Zubin', 'Ajay', 'Divya'
];

const indianLastNames = [
  'Patil', 'Sharma', 'Deshmukh', 'Kulkarni', 'Jadhav', 'More', 'Shinde', 'Pawar', 'Gaikwad', 'Chavan',
  'Joshi', 'Borse', 'Wagh', 'Kale', 'Bhosale', 'Deshpande', 'Rane', 'Thakur', 'Malhotra', 'Gupta',
  'Verma', 'Yadav', 'Singh', 'Khan', 'Ansari', 'Patel', 'Reddy', 'Naik', 'Sawant', 'Kadam',
  'Ingale', 'Sonawane', 'Rathod', 'Lokhande', 'Mane', 'Ghosh', 'Mukherjee', 'Iyer', 'Nair', 'Menon',
  'Tiwari', 'Mishra', 'Pandey', 'Dubey', 'Srivastava', 'Agarwal', 'Banerjee', 'Chakraborty', 'Das', 'Sen'
];

// Seeded pseudo-random for reproducibility
function seededRand(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const rand = seededRand(42);

function randBetween(min, max) {
  return +(min + rand() * (max - min)).toFixed(2);
}

function randInt(min, max) {
  return Math.floor(min + rand() * (max - min + 1));
}

const studentUsers = [];
const mockStudentData = {};
let studentIndex = 0;

for (const dept of DEPT_CODES) {
  const count = DEPT_STUDENT_DIST[dept];
  for (let i = 0; i < count; i++) {
    const globalIdx = studentIndex;
    const localNum = String(i + 1).padStart(3, '0');
    const userId = `stu-uuid-${String(globalIdx + 1).padStart(3, '0')}`;
    const rollNumber = `MIT2024${dept}${localNum}`;
    const firstName = indianFirstNames[globalIdx % indianFirstNames.length];
    const lastName = indianLastNames[globalIdx % indianLastNames.length];
    const username = `student_${rollNumber.toLowerCase()}`;
    const semester = randInt(1, 8);
    const cgpa = randBetween(6.0, 9.8);
    const attendance = randBetween(65, 98);

    studentUsers.push({
      user_id: userId,
      tenant_id: TENANT_ID,
      username: username,
      password_hash: PASSWORD_HASH,
      system_role: 'STUDENT',
      first_name: firstName,
      last_name: lastName,
      department_id: DEPT_IDS[dept],
      department_code: dept
    });

    mockStudentData[userId] = {
      student_id: userId,
      roll_number: rollNumber,
      department_code: dept,
      department_id: DEPT_IDS[dept],
      semester: semester,
      cgpa: cgpa,
      attendance_percentage: attendance,
      admission_year: 2024,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mitaurangabad.in`,
      phone: `+91 ${randInt(70000, 99999)}${randInt(10000, 99999)}`,
      blood_group: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'][randInt(0, 7)],
      hostel_resident: rand() > 0.5,
      status: 'ACTIVE'
    };

    studentIndex++;
  }
}

// ---------------------------------------------------------------------------
// Parent Users (20 — parents for first 20 students)
// ---------------------------------------------------------------------------
const parentUsers = [];
const mockParentLinks = {};

const parentFirstNames = [
  'Ramesh', 'Sunita', 'Mahesh', 'Vandana', 'Prakash',
  'Anita', 'Sunil', 'Lata', 'Ganesh', 'Mangala',
  'Dilip', 'Savita', 'Kishor', 'Rekha', 'Ashok',
  'Sushma', 'Rajendra', 'Jyoti', 'Vilas', 'Shobha'
];

for (let i = 0; i < 20; i++) {
  const parentId = `parent-uuid-${String(i + 1).padStart(3, '0')}`;
  const studentUser = studentUsers[i];
  const parentFirst = parentFirstNames[i];

  parentUsers.push({
    user_id: parentId,
    tenant_id: TENANT_ID,
    username: `parent_${studentUser.username.replace('student_', '')}`,
    password_hash: PASSWORD_HASH,
    system_role: 'PARENT',
    first_name: parentFirst,
    last_name: studentUser.last_name,
    department_id: null,
    department_code: null
  });

  mockParentLinks[parentId] = {
    parent_id: parentId,
    student_id: studentUser.user_id,
    student_name: `${studentUser.first_name} ${studentUser.last_name}`,
    relationship: i % 2 === 0 ? 'Father' : 'Mother'
  };
}

// ---------------------------------------------------------------------------
// Combined mockUsers array
// ---------------------------------------------------------------------------
const mockUsers = [
  ...adminUsers,
  ...hodUsers,
  ...facultyUsers,
  ...studentUsers,
  ...parentUsers
];

// ---------------------------------------------------------------------------
// Extended Faculty Data
// ---------------------------------------------------------------------------
const mockFacultyData = {};

// Populate HOD faculty data
for (const hod of hodUsers) {
  mockFacultyData[hod.user_id] = {
    faculty_id: hod.user_id,
    designation: 'Head of Department',
    department_code: hod.department_code,
    department_id: hod.department_id,
    qualification: 'Ph.D.',
    experience_years: randInt(15, 30),
    specialization: 'Department Administration',
    email: `${hod.username}@mitaurangabad.in`,
    phone: `+91 ${randInt(70000, 99999)}${randInt(10000, 99999)}`,
    publications: randInt(10, 50),
    status: 'ACTIVE'
  };
}

// Populate regular faculty data
for (const fDef of facultyDefinitions) {
  const uid = `fac-uuid-${fDef.idx}`;
  mockFacultyData[uid] = {
    faculty_id: uid,
    designation: fDef.designation,
    department_code: fDef.dept,
    department_id: DEPT_IDS[fDef.dept],
    qualification: fDef.designation.includes('Dr.') || fDef.designation === 'Professor' ? 'Ph.D.' : 'M.Tech.',
    experience_years: fDef.designation === 'Professor' ? randInt(15, 25) : fDef.designation === 'Associate Professor' ? randInt(8, 18) : randInt(3, 10),
    specialization: fDef.specialization,
    email: `${fDef.username}@mitaurangabad.in`,
    phone: `+91 ${randInt(70000, 99999)}${randInt(10000, 99999)}`,
    publications: randInt(2, 35),
    status: 'ACTIVE'
  };
}

// Simple in-memory marks store
const mockMarks = {};
// Simple in-memory ledger lines
const mockLedger = [];

let useMockFallback = false;

// Attempt a test connection on boot to detect if PostgreSQL is running
try {
  const testClient = await pool.connect();
  console.log('[SutraOS DB] Successfully connected to PostgreSQL.');
  testClient.release();
} catch (err) {
  console.log('[SutraOS DB] WARNING: PostgreSQL connection failed. Activating Sandbox Mock Database Fallback.');
  useMockFallback = true;
}

/**
 * Mock database query executor for testing without PostgreSQL installed.
 */
function executeMockQuery(text, params, context) {
  const sql = text.trim().replace(/\s+/g, ' ');

  // 1. User Login Query
  if (sql.includes('FROM user_accounts u') && sql.includes('WHERE u.username = $1')) {
    const username = params[0];
    const user = mockUsers.find(u => u.username === username);
    return { rows: user ? [user] : [] };
  }

  // 2. Marks Modification / CIE Entry Simulation
  if (sql.includes('INSERT INTO student_marks')) {
    const student_id = params[0];
    const exam_schedule_id = params[1];
    const marks_obtained = params[2];
    const is_absent = params[3];
    const userId = params[4];

    // Simulate Marks Immutability Trigger:
    const key = `${student_id}_${exam_schedule_id}`;
    if (mockMarks[key] && mockMarks[key].verification_status === 'APPROVED') {
      throw new Error('Academic lock: Published grades are immutable. Initiate revaluation workflow instead.');
    }

    mockMarks[key] = {
      student_id,
      exam_schedule_id,
      marks_obtained,
      is_absent,
      verification_status: 'PENDING', // Trigger recalculate
      marks_integrity_hash: 'MOCK_SHA256_INTEGRITY_HASH_VALUE'
    };

    console.log(`[DB Mock Trigger] Marks saved: Student ${student_id} -> ${marks_obtained} (CIE / ESE). Integrity Hash recalculated.`);
    return { rows: [mockMarks[key]] };
  }

  // 3. Finance Journal Lines Posting Simulation
  if (sql.includes('INSERT INTO general_ledger_lines')) {
    const entryId = params[0];
    const accountId = params[1];
    const studentId = params[2];
    const debit = params[3];
    const credit = params[4];

    mockLedger.push({ entryId, accountId, studentId, debit, credit });
    return { rows: [] };
  }

  // 4. Finance Posting Status Trigger Simulation (verify_journal_balance)
  if (sql.includes('UPDATE journal_entries SET posting_status = \'POSTED\'')) {
    const entryId = params[0];
    const lines = mockLedger.filter(l => l.entryId === entryId);

    const debitSum = lines.reduce((sum, l) => sum + l.debit, 0);
    const creditSum = lines.reduce((sum, l) => sum + l.credit, 0);

    if (debitSum === 0 && creditSum === 0) {
      throw new Error('Transaction unbalance: Cannot post an empty journal entry.');
    }

    if (debitSum !== creditSum) {
      throw new Error(`Double-entry failure: Total debits (${debitSum}) must equal total credits (${creditSum}).`);
    }

    console.log(`[DB Mock Trigger] Journal posted successfully. verify_journal_balance OK: Debits = ${debitSum}, Credits = ${creditSum}`);
    return { rows: [] };
  }

  // 5. Select Student Marks Simulation
  if (sql.includes('SELECT') && sql.includes('student_marks')) {
    return { rows: [] };
  }

  // Generic return for INSERTs / setup queries
  const dynamicUuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return { rows: [{ entry_id: dynamicUuid }] };
}

/**
 * Secure query wrapper, fallback to sandbox javascript db if PG database connection drops.
 */
export async function querySecure(text, params = [], context = {}) {
  if (useMockFallback) {
    return executeMockQuery(text, params, context);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tenantId = context.tenant_id || '00000000-0000-0000-0000-000000000000';
    const userRole = context.role || 'PUBLIC';
    const userDept = context.department_code || 'NONE';

    await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
    await client.query(`SET LOCAL app.current_user_role = '${userRole}'`);
    await client.query(`SET LOCAL app.current_user_dept = '${userDept}'`);

    const res = await client.query(text, params);
    
    await client.query('COMMIT');
    return res;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Export all mock data collections for use by API endpoints
export { mockUsers, mockStudentData, mockDepartments, mockFacultyData, mockParentLinks };

export default pool;
