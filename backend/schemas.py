from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    system_role: str
    department_id: Optional[str] = None

class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    system_role: str
    department_id: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

class DepartmentCreate(BaseModel):
    name: str
    code: str

class DepartmentOut(BaseModel):
    id: str
    name: str
    code: str

    class Config:
        from_attributes = True

class DesignationCreate(BaseModel):
    title: str

class DesignationOut(BaseModel):
    id: str
    title: str
    
    class Config:
        from_attributes = True

class StudentCreate(BaseModel):
    user: UserCreate
    batch_year: int
    current_semester: int = 1
    parent_whatsapp: Optional[str] = None
    parent_email: Optional[EmailStr] = None

class StudentProfileOut(BaseModel):
    id: str
    enrollment_number: str
    current_semester: int
    batch_year: int
    parent_whatsapp: Optional[str]
    parent_email: Optional[str]
    cgpa: str
    
    class Config:
        from_attributes = True

class StudentOut(UserOut):
    student_profile: Optional[StudentProfileOut]

class FacultyCreate(BaseModel):
    user: UserCreate
    designation_id: Optional[str] = None

class FacultyProfileOut(BaseModel):
    id: str
    employee_id: str
    designation: Optional[DesignationOut]

    class Config:
        from_attributes = True

class FacultyOut(UserOut):
    faculty_profile: Optional[FacultyProfileOut]

class FeeInvoiceCreate(BaseModel):
    student_id: str
    amount: float
    description: str

class FeeInvoiceOut(BaseModel):
    id: str
    student_id: str
    amount: float
    description: str
    status: str
    receipt_number: Optional[str]
    paid_at: Optional[str] = None # Will format datetime to string if needed
    due_date: Optional[str] = None

    class Config:
        from_attributes = True

class LeaveRequestCreate(BaseModel):
    start_date: str
    end_date: str
    reason: str

class LeaveRequestOut(BaseModel):
    id: str
    faculty_id: str
    start_date: str
    end_date: str
    reason: str
    status: str
    approved_by_id: Optional[str]
    faculty: Optional[UserOut]
    approved_by: Optional[UserOut]

    class Config:
        from_attributes = True

class CourseCreate(BaseModel):
    code: str
    name: str
    credits: int
    is_elective: bool
    department_id: str

class CourseOut(BaseModel):
    id: str
    code: str
    name: str
    credits: int
    is_elective: bool
    department_id: str

    class Config:
        from_attributes = True

class ClassroomOut(BaseModel):
    id: str
    room_number: str
    building: Optional[str]

    class Config:
        from_attributes = True

class CourseOfferingOut(BaseModel):
    id: str
    course: CourseOut
    faculty: UserOut
    division: Optional[str]
    batch: Optional[str]

    class Config:
        from_attributes = True

class TimetableSlotOut(BaseModel):
    id: str
    offering: CourseOfferingOut
    classroom: ClassroomOut
    day_of_week: str
    start_time: str
    end_time: str

    class Config:
        from_attributes = True

class AttendanceMark(BaseModel):
    student_id: str
    is_present: bool

class AttendanceBulk(BaseModel):
    slot_id: str
    date: str
    records: list[AttendanceMark]

# --- PHASE 5 & 6 SCHEMAS ---

class ExamResultCreate(BaseModel):
    student_id: str
    course_id: str
    semester: int
    ise_marks: float
    ese_marks: float

class ExamResultOut(BaseModel):
    id: str
    student_id: str
    course_id: str
    semester: int
    ise_marks: Optional[float]
    ese_marks: Optional[float]
    total_marks: Optional[float]
    grade: Optional[str]
    course: Optional[CourseOut]
    
    class Config:
        from_attributes = True

class PlacementDriveCreate(BaseModel):
    company_name: str
    role: str
    ctc: str
    min_cgpa: float
    drive_date: Optional[str] = None
    eligible_departments: Optional[str] = None

class PlacementDriveOut(BaseModel):
    id: str
    company_name: str
    role: str
    ctc: str
    min_cgpa: float
    drive_date: Optional[str] = None
    eligible_departments: Optional[str] = None

    class Config:
        from_attributes = True

class PlacementEndorsementOut(BaseModel):
    id: str
    student_id: str
    hod_id: Optional[str]
    status: str
    student: Optional[UserOut]

    class Config:
        from_attributes = True

class GatepassRequestCreate(BaseModel):
    reason: str
    out_date: str
    in_date: str

class GatepassRequestOut(BaseModel):
    id: str
    student_id: str
    reason: str
    out_date: str
    in_date: str
    status: str
    student: Optional[UserOut]

    class Config:
        from_attributes = True

class BulletinPostCreate(BaseModel):
    content: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None

class BulletinPostOut(BaseModel):
    id: str
    content: str
    created_at: str
    author_id: str
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None

    class Config:
        from_attributes = True

class RequisitionTicketCreate(BaseModel):
    ticket_type: str
    description: str

class RequisitionTicketOut(BaseModel):
    id: str
    ticket_type: str
    description: str
    status: str
    requester_id: str

    class Config:
        from_attributes = True
