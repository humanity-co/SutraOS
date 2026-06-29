from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float, DateTime, Date, JSON
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Designation(Base):
    __tablename__ = "designations"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    title = Column(String, unique=True, index=True, nullable=False)

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    
    users = relationship("User", back_populates="department")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    system_role = Column(String, nullable=False)
    additional_roles = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    department = relationship("Department", back_populates="users")

    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    faculty_profile = relationship("FacultyProfile", back_populates="user", uselist=False)

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    enrollment_number = Column(String, unique=True, index=True, nullable=False)
    current_semester = Column(Integer, default=1)
    batch_year = Column(Integer, nullable=False)
    parent_whatsapp = Column(String, nullable=True)
    parent_email = Column(String, nullable=True)
    cgpa = Column(String, default="0.0")

    user = relationship("User", back_populates="student_profile")

class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    designation_id = Column(String, ForeignKey("designations.id"), nullable=True)
    mega_profile_data = Column(JSON, nullable=True, default={})

    user = relationship("User", back_populates="faculty_profile")
    designation = relationship("Designation")

class FeeInvoice(Base):
    __tablename__ = "fee_invoices"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, PAID
    receipt_number = Column(String, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    student = relationship("User", foreign_keys=[student_id])

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    faculty_id = Column(String, ForeignKey("users.id"), nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    approved_by_id = Column(String, ForeignKey("users.id"), nullable=True)

    faculty = relationship("User", foreign_keys=[faculty_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])

class Course(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    credits = Column(Integer, default=3)
    is_elective = Column(Boolean, default=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    room_number = Column(String, unique=True, nullable=False)
    building = Column(String, nullable=True)

class CourseOffering(Base):
    __tablename__ = "course_offerings"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    faculty_id = Column(String, ForeignKey("users.id"), nullable=False)
    division = Column(String, nullable=True)
    batch = Column(String, nullable=True)
    
    course = relationship("Course")
    faculty = relationship("User")

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    offering_id = Column(String, ForeignKey("course_offerings.id"), nullable=False)
    classroom_id = Column(String, ForeignKey("classrooms.id"), nullable=False)
    day_of_week = Column(String, nullable=False) # e.g. "Monday"
    start_time = Column(String, nullable=False) # e.g. "10:00 AM"
    end_time = Column(String, nullable=False)   # e.g. "11:00 AM"
    
    offering = relationship("CourseOffering")
    classroom = relationship("Classroom")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    slot_id = Column(String, ForeignKey("timetable_slots.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False) # ISO String YYYY-MM-DD
    is_present = Column(Boolean, nullable=False)
    
    slot = relationship("TimetableSlot")
    student = relationship("User")

# --- PHASE 5 & 6 MODELS ---

class ExamResult(Base):
    __tablename__ = "exam_results"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    ise_marks = Column(Float, nullable=True) # In-Semester
    ese_marks = Column(Float, nullable=True) # End-Semester
    total_marks = Column(Float, nullable=True)
    grade = Column(String, nullable=True) # Relative grade (e.g. A, B, C)
    
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course")


class PlacementEndorsement(Base):
    __tablename__ = "placement_endorsements"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    hod_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    
    student = relationship("User", foreign_keys=[student_id])
    hod = relationship("User", foreign_keys=[hod_id])

class JobOffer(Base):
    __tablename__ = "job_offers"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    drive_id = Column(String, ForeignKey("placement_drives_v2.id"), nullable=False)
    status = Column(String, default="OFFERED")
    
    student = relationship("User")
    drive = relationship("PlacementDrive")

class GatepassRequest(Base):
    __tablename__ = "gatepass_requests"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    out_date = Column(String, nullable=False)
    in_date = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    
    student = relationship("User")

class BulletinPost(Base):
    __tablename__ = "bulletin_posts"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(String, nullable=False) # ISO String

    attachment_url = Column(String, nullable=True)
    attachment_type = Column(String, nullable=True) # IMAGE, PDF, EXCEL, VIDEO

    author = relationship("User")

class RequisitionTicket(Base):
    __tablename__ = "requisition_tickets"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    requester_id = Column(String, ForeignKey("users.id"), nullable=False)
    ticket_type = Column(String, nullable=False) # e.g. "IT Support", "Maintenance"
    description = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, IN_PROGRESS, RESOLVED

    requester = relationship("User")

# --- PHASE 9: WORLD CLASS ERP MODELS ---

class ExamRecord(Base):
    __tablename__ = "exam_records"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    exam_type = Column(String, nullable=False) # e.g., ISE-1, ESE
    marks_obtained = Column(Float, nullable=False)
    max_marks = Column(Float, nullable=False)
    is_published = Column(Boolean, default=False)
    cryptographic_hash = Column(String, nullable=True) # SHA-256 hash of student_id + marks + salt to prevent tampering

    course = relationship("Course")
    student = relationship("User")

class ExamAuditLog(Base):
    __tablename__ = "exam_audit_logs"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    exam_record_id = Column(String, ForeignKey("exam_records.id"), nullable=False)
    changed_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    previous_marks = Column(Float, nullable=True)
    new_marks = Column(Float, nullable=False)
    timestamp = Column(String, nullable=False) # ISO String
    ip_address = Column(String, nullable=True)

class ScholarshipLedger(Base):
    __tablename__ = "scholarship_ledgers"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    scholarship_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    # Dual Approval Workflow
    status = Column(String, default="PENDING_SCHOLARSHIP_SECTION") # PENDING_SCHOLARSHIP_SECTION, PENDING_ACCOUNTS, APPROVED, REJECTED
    scholarship_officer_id = Column(String, ForeignKey("users.id"), nullable=True)
    accounts_officer_id = Column(String, ForeignKey("users.id"), nullable=True)

class PlacementDrive(Base):
    __tablename__ = "placement_drives_v2" # Using v2 to avoid conflicts with previous empty tables
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    company_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    ctc = Column(String, nullable=False)
    min_cgpa = Column(Float, nullable=False)
    drive_date = Column(String, nullable=False)
    status = Column(String, default="UPCOMING")
    eligible_departments = Column(String, nullable=True) # e.g. "CSE, ME"

class PlacementApplication(Base):
    __tablename__ = "placement_applications"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    drive_id = Column(String, ForeignKey("placement_drives_v2.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    current_round = Column(Integer, default=1) # 1: Aptitude, 2: Technical, 3: HR, 4: Offered
    status = Column(String, default="IN_PROGRESS") # IN_PROGRESS, REJECTED, OFFERED

