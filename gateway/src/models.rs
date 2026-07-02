use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Department {
    pub department_id: String,
    pub tenant_id: String,
    pub code: String,
    pub name: String,
    pub hod_user_id: String,
    pub established_year: u32,
    pub intake_capacity: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserAccount {
    pub user_id: String,
    pub tenant_id: String,
    pub username: String,
    pub password_hash: String,
    pub system_role: String,
    pub first_name: String,
    pub last_name: String,
    pub department_id: Option<String>,
    pub department_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudentData {
    pub student_id: String,
    pub roll_number: String,
    pub department_code: String,
    pub department_id: String,
    pub semester: u32,
    pub cgpa: f64,
    pub attendance_percentage: f64,
    pub admission_year: u32,
    pub email: String,
    pub phone: String,
    pub blood_group: String,
    pub hostel_resident: bool,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FacultyData {
    pub faculty_id: String,
    pub designation: String,
    pub department_code: String,
    pub department_id: String,
    pub qualification: String,
    pub experience_years: u32,
    pub specialization: String,
    pub email: String,
    pub phone: String,
    pub publications: u32,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParentLink {
    pub parent_id: String,
    pub student_id: String,
    pub student_name: String,
    pub relationship: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockMarks {
    pub student_id: String,
    pub exam_schedule_id: String,
    pub marks_obtained: f64,
    pub is_absent: bool,
    pub verification_status: String,
    pub marks_integrity_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MockLedgerLine {
    pub entry_id: String,
    pub account_id: String,
    pub student_id: Option<String>,
    pub debit: f64,
    pub credit: f64,
}
