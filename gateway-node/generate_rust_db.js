import { mockUsers, mockStudentData, mockDepartments, mockFacultyData, mockParentLinks } from './db.js';
import fs from 'fs';

let rustCode = `
use lazy_static::lazy_static;
use std::collections::HashMap;
use crate::models::*;
use std::sync::Mutex;

lazy_static! {
    pub static ref MOCK_DEPARTMENTS: Vec<Department> = serde_json::from_str(r#"
${JSON.stringify(mockDepartments)}
    "#).unwrap();

    pub static ref MOCK_USERS: Vec<UserAccount> = serde_json::from_str(r#"
${JSON.stringify(mockUsers)}
    "#).unwrap();

    pub static ref MOCK_STUDENT_DATA: HashMap<String, StudentData> = serde_json::from_str(r#"
${JSON.stringify(mockStudentData)}
    "#).unwrap();

    pub static ref MOCK_FACULTY_DATA: HashMap<String, FacultyData> = serde_json::from_str(r#"
${JSON.stringify(mockFacultyData)}
    "#).unwrap();

    pub static ref MOCK_PARENT_LINKS: HashMap<String, ParentLink> = serde_json::from_str(r#"
${JSON.stringify(mockParentLinks)}
    "#).unwrap();

    pub static ref MOCK_MARKS: Mutex<HashMap<String, MockMarks>> = Mutex::new(HashMap::new());
    pub static ref MOCK_LEDGER: Mutex<Vec<MockLedgerLine>> = Mutex::new(Vec::new());
}

pub async fn query_secure(sql: &str, params: Vec<String>) -> Result<serde_json::Value, String> {
    // Basic mock query handler
    if sql.contains("FROM user_accounts") {
        if params.len() > 0 {
            let user = MOCK_USERS.iter().find(|u| u.username == params[0]);
            if let Some(u) = user {
                return Ok(serde_json::json!({ "rows": [u] }));
            }
        }
        return Ok(serde_json::json!({ "rows": [] }));
    }
    
    // Default fallback
    Ok(serde_json::json!({ "rows": [{ "entry_id": uuid::Uuid::new_v4().to_string() }] }))
}
`;

fs.writeFileSync('../gateway/src/db.rs', rustCode.trim());
console.log("Rust db.rs generated successfully.");
