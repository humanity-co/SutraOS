from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

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
    additional_roles: Optional[list[str]] = []
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
    admission_category: Optional[str] = "OPEN"

class StudentProfileOut(BaseModel):
    id: str
    enrollment_number: str
    current_semester: int
    batch_year: int
    parent_whatsapp: Optional[str]
    parent_email: Optional[str]
    cgpa: str
    admission_category: str
    
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
    invoice_type: Optional[str] = "TUITION"
    student_share: Optional[float] = None
    govt_share: Optional[float] = None
    due_date: Optional[datetime] = None
    mahadbt_application_id: Optional[str] = None

class FeeInvoiceOut(BaseModel):
    id: str
    student_id: str
    amount: float
    student_share: float
    govt_share: float
    description: str
    invoice_type: str
    status: str
    receipt_number: Optional[str]
    paid_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    mahadbt_application_id: Optional[str]

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
    signature_verified: bool = False
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

class ExamRecordCreate(BaseModel):
    student_id: str
    course_id: str
    exam_type: str
    marks_obtained: float
    max_marks: float

class ScholarshipCreate(BaseModel):
    student_id: str
    scholarship_name: str
    amount: float


# --- LIBRARY SCHEMAS ---
class LibraryBookCreate(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    total_copies: Optional[int] = 5

class LibraryBookOut(BaseModel):
    id: str
    title: str
    author: str
    isbn: Optional[str] = None
    total_copies: int
    available_copies: int
    
    class Config:
        from_attributes = True

class LibraryCheckoutCreate(BaseModel):
    book_id: str
    student_username: Optional[str] = None

class LibraryCheckoutOut(BaseModel):
    id: str
    student_id: str
    book_id: str
    checkout_date: str
    due_date: str
    returned_at: Optional[str] = None
    status: str
    book: Optional[LibraryBookOut] = None
    
    class Config:
        from_attributes = True


# --- TRANSPORT SCHEMAS ---
class BusStopCreate(BaseModel):
    name: str

class BusStopOut(BaseModel):
    id: str
    name: str
    
    class Config:
        from_attributes = True

class BusRouteCreate(BaseModel):
    route_name: str
    bus_number: str
    driver_name: str
    capacity: Optional[int] = 30

class BusRouteOut(BaseModel):
    id: str
    route_name: str
    bus_number: str
    driver_name: str
    capacity: int
    reserved_seats: int
    stops: Optional[list[BusStopOut]] = []
    
    class Config:
        from_attributes = True

class TransportReservationCreate(BaseModel):
    pickup_stop: str
    pickup_route_id: str
    destination_stop: str
    destination_route_id: str

class TransportReservationOut(BaseModel):
    id: str
    student_id: str
    pickup_stop: str
    pickup_route_id: str
    destination_stop: str
    destination_route_id: str
    vehicle_no: Optional[str] = None
    paid_amount: float
    is_paid: bool
    fee_amount: float
    approval_authority: str
    approval_status: str
    seat_number: Optional[int] = None
    reserved_at: str
    pickup_route: Optional[BusRouteOut] = None
    destination_route: Optional[BusRouteOut] = None
    student: Optional[UserOut] = None
    
    class Config:
        from_attributes = True


# --- HOSTEL SCHEMAS ---
class HostelAdmissionCreate(BaseModel):
    course_year: Optional[str] = "VI"
    gender: Optional[str] = "Male"
    policy_name: Optional[str] = "MIT Aurangabad Hostel Policy"
    plan_name: Optional[str] = "Hostel Plan 2025-2026"
    
    father_name: str
    father_contact: str
    father_address: str
    mother_name: Optional[str] = None
    mother_contact: Optional[str] = None
    mother_address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_contact: Optional[str] = None
    guardian_address: Optional[str] = None
    
    vehicle_number: Optional[str] = None
    license_number: Optional[str] = None

class HostelAdmissionOut(BaseModel):
    id: str
    student_id: str
    course_year: Optional[str] = None
    gender: Optional[str] = None
    policy_name: Optional[str] = None
    plan_name: Optional[str] = None
    
    father_name: Optional[str] = None
    father_contact: Optional[str] = None
    father_address: Optional[str] = None
    mother_name: Optional[str] = None
    mother_contact: Optional[str] = None
    mother_address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_contact: Optional[str] = None
    guardian_address: Optional[str] = None
    
    vehicle_number: Optional[str] = None
    license_number: Optional[str] = None
    
    block_name: Optional[str] = None
    floor_name: Optional[str] = None
    room_number: Optional[str] = None
    
    status: str
    parent_consent_approved: bool
    student: Optional[UserOut] = None
    
    class Config:
        from_attributes = True

class HostelAllocationRequest(BaseModel):
    block_name: str
    floor_name: str
    room_number: str


# --- OFF CAMPUS PLACEMENT SCHEMAS ---
class OffCampusPlacementCreate(BaseModel):
    company_name: str
    job_profile: str
    probation_months: Optional[int] = None
    after_confirmation_salary: str
    probation_salary: Optional[str] = None
    bond_months: Optional[int] = None
    joining_date: str

class OffCampusPlacementOut(BaseModel):
    id: str
    student_id: str
    company_name: str
    job_profile: str
    probation_months: Optional[int]
    after_confirmation_salary: str
    probation_salary: Optional[str]
    bond_months: Optional[int]
    joining_date: str
    status: str
    student: Optional[UserOut] = None

    class Config:
        from_attributes = True


# --- MESS MANAGEMENT ---
class MessMenuOut(BaseModel):
    id: str
    day_of_week: str
    breakfast: str
    lunch: str
    snacks: str
    dinner: str
    class Config:
        from_attributes = True

class MessFeedbackCreate(BaseModel):
    rating: int
    review: Optional[str] = None

class MessFeedbackOut(BaseModel):
    id: str
    student_id: str
    rating: int
    review: Optional[str]
    created_at: str
    student: Optional[UserOut] = None
    class Config:
        from_attributes = True

class MessGroceryOut(BaseModel):
    id: str
    item_name: str
    current_stock: float
    min_stock: float
    unit: str
    class Config:
        from_attributes = True

# --- SPORTS MANAGEMENT ---
class SportsEquipmentCreate(BaseModel):
    name: str
    total_qty: int

class SportsEquipmentOut(BaseModel):
    id: str
    name: str
    total_qty: int
    available_qty: int
    class Config:
        from_attributes = True

class SportsIssueRequestCreate(BaseModel):
    equipment_id: str
    quantity: int

class SportsIssueRequestOut(BaseModel):
    id: str
    student_id: str
    equipment_id: str
    quantity: int
    status: str
    request_date: str
    returned_at: Optional[str]
    student: Optional[UserOut] = None
    equipment: Optional[SportsEquipmentOut] = None
    class Config:
        from_attributes = True

class SportsTournamentCreate(BaseModel):
    team_name: str
    sport_name: str
    members_count: int

class SportsTournamentOut(BaseModel):
    id: str
    team_name: str
    sport_name: str
    members_count: int
    registered_by_id: str
    registered_at: str
    registered_by: Optional[UserOut] = None
    class Config:
        from_attributes = True

# --- MAINTENANCE ---
class MaintenanceTicketCreate(BaseModel):
    category: str
    block_name: str
    description: str

class MaintenanceTicketOut(BaseModel):
    id: str
    reporter_id: str
    category: str
    block_name: str
    description: str
    assigned_to_staff: Optional[str]
    status: str
    created_at: str
    reporter: Optional[UserOut] = None
    class Config:
        from_attributes = True

# --- CENTRAL STORE & VENDING ---
class CentralStoreItemCreate(BaseModel):
    item_name: str
    quantity: int
    unit: str

class CentralStoreItemOut(BaseModel):
    id: str
    item_name: str
    quantity: int
    unit: str
    class Config:
        from_attributes = True

class StoreRequisitionCreate(BaseModel):
    item_id: str
    quantity: int

class StoreRequisitionOut(BaseModel):
    id: str
    user_id: str
    item_id: str
    quantity: int
    status: str
    requested_at: str
    user: Optional[UserOut] = None
    item: Optional[CentralStoreItemOut] = None
    class Config:
        from_attributes = True

class VendingMachineItemOut(BaseModel):
    id: str
    location: str
    item_name: str
    quantity: int
    max_quantity: int
    class Config:
        from_attributes = True


# --- RESEARCH MODULE SCHEMAS ---
class ResearchProjectCreate(BaseModel):
    title: str
    funding_agency: str
    amount: float
    duration: str

class ResearchProjectOut(BaseModel):
    id: str
    title: str
    funding_agency: str
    amount: float
    duration: str
    status: str
    faculty_id: str
    faculty: Optional[UserOut] = None
    class Config:
        from_attributes = True

class ResearchPublicationCreate(BaseModel):
    title: str
    journal: str
    author_name: str
    year: int
    doi: Optional[str] = None

class ResearchPublicationOut(BaseModel):
    id: str
    title: str
    journal: str
    author_name: str
    year: int
    doi: Optional[str] = None
    citation_count: int
    class Config:
        from_attributes = True


# --- DOCUMENT LOCKER SCHEMAS ---
class DocumentLockerCreate(BaseModel):
    doc_name: str
    doc_type: str
    file_size: str

class DocumentLockerOut(BaseModel):
    id: str
    owner_id: str
    doc_name: str
    doc_type: str
    file_size: str
    uploaded_at: str
    cryptographic_hash: str
    class Config:
        from_attributes = True


# --- ADMISSIONS SCHEMAS ---
class AdmissionApplicationCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    hsc_percentage: float
    category: str

class AdmissionApplicationOut(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    hsc_percentage: float
    category: str
    status: str
    applied_at: str
    class Config:
        from_attributes = True

class StudentDirectRegister(BaseModel):
    first_name: str
    last_name: str
    email: str
    username: str
    password: str
    department_code: str
    category: str
    father_name: Optional[str] = None
    father_contact: Optional[str] = None
    father_address: Optional[str] = None
    mother_name: Optional[str] = None
    mother_contact: Optional[str] = None
    mother_address: Optional[str] = None

# --- COMMUNICATION SCHEMAS ---
class ParentBroadcastCreate(BaseModel):
    audience_type: str # ALL, LOW_ATTENDANCE, DEPARTMENT
    message: str
    department_code: Optional[str] = None

# --- DOUBLE-ENTRY ACCOUNTING SCHEMAS ---
class GLAccountBase(BaseModel):
    name: str
    group: str
    balance_type: str

class GLAccountOut(GLAccountBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class VoucherEntryCreate(BaseModel):
    account_id: str
    cost_center_id: Optional[str] = None
    fund_id: Optional[str] = None
    debit: float = 0.0
    credit: float = 0.0

class VoucherCreate(BaseModel):
    voucher_type: str
    narration: str
    entries: list[VoucherEntryCreate]

class VoucherEntryOut(BaseModel):
    id: str
    account_id: str
    debit: float
    credit: float
    account: Optional[GLAccountOut] = None
    class Config:
        from_attributes = True

class VoucherOut(BaseModel):
    id: str
    voucher_type: str
    voucher_number: str
    voucher_date: datetime
    narration: str
    created_by: str
    entries: list[VoucherEntryOut]
    class Config:
        from_attributes = True

class ParentBroadcastOut(BaseModel):
    id: str
    sender_id: str
    audience_type: str
    message: str
    sent_at: str
    recipient_count: int
    class Config:
        from_attributes = True

# --- PHASE 3: SCHEMAS ---
class ServiceBookCreate(BaseModel):
    faculty_id: str
    basic_pay: float
    da_allowance: float = 0.0
    hra_allowance: float = 0.0
    tax_declaration: Optional[dict] = None

class PayrollRunRequest(BaseModel):
    month: str # e.g., "2026-06"

class GrievanceTicketCreate(BaseModel):
    category: str
    description: str
    is_anonymous: bool = True

class PurchaseIndentCreate(BaseModel):
    item_name: str
    quantity: int

class AlumniOnboardRequest(BaseModel):
    batch_year: int
    department: str
    contact_number: str
    current_company: str
    otp: str
