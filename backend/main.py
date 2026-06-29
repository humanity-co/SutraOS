from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
import uvicorn
from contextlib import asynccontextmanager
from datetime import datetime

from database import engine, Base, get_db
import models, schemas, auth
from typing import Optional

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    pass

ROLE_MAP = {
    "SUPER_ADMIN": "System Administrator",
    "INSTITUTION_ADMIN": "Institution Admin",
    "PRINCIPAL": "Principal",
    "REGISTRAR": "Registrar",
    "EXAM_CONTROLLER": "Controller of Examinations",
    "ACCOUNTS": "Accounts Head",
    "PLACEMENT_OFFICER": "Training & Placement Officer",
    "HOD": "Head of Department",
    "FACULTY": "Faculty Member",
    "STUDENT": "Student"
}

app = FastAPI(title="SutraOS API", lifespan=lifespan)

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/bulletin/upload")
async def upload_bulletin_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    return {"filename": file.filename, "url": f"/uploads/{file.filename}"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- AUTH ENDPOINTS ---

from datetime import timedelta

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(func.lower(models.User.username) == func.lower(form_data.username.strip())))
    user = result.scalars().first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except auth.jwt.PyJWTError:
        raise credentials_exception
        
    result = await db.execute(select(models.User).where(models.User.username == username))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

def require_role(allowed_roles: list[str]):
    async def dependency(current_user: models.User = Depends(get_current_user)):
        if current_user.system_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to perform this action"
            )
        return current_user
    return dependency

# --- USERS ENDPOINTS ---

@app.post("/users", response_model=schemas.UserOut)
async def create_user(user: schemas.UserCreate, current_user: models.User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])), db: AsyncSession = Depends(get_db)):
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
    result = await db.execute(select(models.User).where(models.User.username == user.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        system_role=user.system_role,
        department_id=user.department_id
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.get("/users/me", response_model=schemas.UserOut)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users", response_model=list[schemas.UserOut])
async def list_users(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.User))
    return result.scalars().all()

# --- DEPARTMENTS ENDPOINTS ---

@app.post("/departments", response_model=schemas.DepartmentOut)
async def create_department(dept: schemas.DepartmentCreate, current_user: models.User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])), db: AsyncSession = Depends(get_db)):
    db_dept = models.Department(name=dept.name, code=dept.code)
    db.add(db_dept)
    await db.commit()
    await db.refresh(db_dept)
    return db_dept

@app.get("/departments", response_model=list[schemas.DepartmentOut])
async def read_departments(skip: int = 0, limit: int = 100, current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Department).offset(skip).limit(limit))
    return result.scalars().all()

# --- DESIGNATIONS ENDPOINTS ---

@app.post("/designations", response_model=schemas.DesignationOut)
async def create_designation(designation: schemas.DesignationCreate, current_user: models.User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])), db: AsyncSession = Depends(get_db)):
    db_desig = models.Designation(title=designation.title)
    db.add(db_desig)
    await db.commit()
    await db.refresh(db_desig)
    return db_desig

@app.get("/designations", response_model=list[schemas.DesignationOut])
async def read_designations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Designation))
    return result.scalars().all()

# --- STUDENTS ENDPOINTS ---

@app.post("/students", response_model=schemas.StudentOut)
async def create_student(student: schemas.StudentCreate, db: AsyncSession = Depends(get_db)):
    # 1. Check if username exists
    result = await db.execute(select(models.User).where(models.User.username == student.user.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    # 2. Get Department code for roll number
    dept = None
    if student.user.department_id:
        dept_res = await db.execute(select(models.Department).where(models.Department.id == student.user.department_id))
        dept = dept_res.scalars().first()
        
    dept_code = dept.code if dept else "GEN"
    
    # 3. Generate sequential roll number: MIT-{YEAR}-{DEPT}-{00X}
    # Count existing students in this batch and dept
    count_res = await db.execute(
        select(func.count(models.StudentProfile.id))
        .join(models.User)
        .where(models.StudentProfile.batch_year == student.batch_year)
        .where(models.User.department_id == student.user.department_id)
    )
    count = count_res.scalar() or 0
    roll_number = f"MIT-{student.batch_year}-{dept_code}-{str(count + 1).zfill(3)}"
    
    # 4. Create User
    hashed_password = auth.get_password_hash(student.user.password)
    db_user = models.User(
        username=student.user.username,
        email=student.user.email,
        hashed_password=hashed_password,
        first_name=student.user.first_name,
        last_name=student.user.last_name,
        system_role="STUDENT",
        department_id=student.user.department_id
    )
    db.add(db_user)
    await db.commit()
    
    # 5. Create Profile
    db_profile = models.StudentProfile(
        user_id=db_user.id,
        enrollment_number=roll_number,
        current_semester=student.current_semester,
        batch_year=student.batch_year,
        parent_whatsapp=student.parent_whatsapp,
        parent_email=student.parent_email
    )
    db.add(db_profile)
    await db.commit()
    
    # Refresh and load relations
    result = await db.execute(select(models.User).options(selectinload(models.User.student_profile)).where(models.User.id == db_user.id))
    return result.scalars().first()

@app.get("/directory/students", response_model=list[schemas.StudentOut])
async def read_students(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.User)
        .where(models.User.system_role == "STUDENT")
        .options(selectinload(models.User.student_profile))
    )
    return result.scalars().all()

# --- FACULTY ENDPOINTS ---

@app.post("/faculty", response_model=schemas.FacultyOut)
async def create_faculty(faculty: schemas.FacultyCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.username == faculty.user.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    # Generate employee ID: MIT-FAC-{00X}
    count_res = await db.execute(select(func.count(models.FacultyProfile.id)))
    count = count_res.scalar() or 0
    emp_id = f"MIT-FAC-{str(count + 1).zfill(3)}"
    
    hashed_password = auth.get_password_hash(faculty.user.password)
    db_user = models.User(
        username=faculty.user.username,
        email=faculty.user.email,
        hashed_password=hashed_password,
        first_name=faculty.user.first_name,
        last_name=faculty.user.last_name,
        system_role="FACULTY",
        department_id=faculty.user.department_id
    )
    db.add(db_user)
    await db.commit()
    
    db_profile = models.FacultyProfile(
        user_id=db_user.id,
        employee_id=emp_id,
        designation_id=faculty.designation_id
    )
    db.add(db_profile)
    await db.commit()
    
    result = await db.execute(
        select(models.User)
        .options(selectinload(models.User.faculty_profile).selectinload(models.FacultyProfile.designation))
        .where(models.User.id == db_user.id)
    )
    return result.scalars().first()

@app.get("/directory/faculty", response_model=list[schemas.FacultyOut])
async def read_faculty(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.User)
        .where(models.User.system_role == "FACULTY")
        .options(selectinload(models.User.faculty_profile).selectinload(models.FacultyProfile.designation))
    )
    return result.scalars().all()

# --- FINANCE ENDPOINTS ---

@app.post("/finance/invoices", response_model=schemas.FeeInvoiceOut)
async def generate_invoice(invoice: schemas.FeeInvoiceCreate, current_user: models.User = Depends(require_role(["ACCOUNTS", "SUPER_ADMIN"])), db: AsyncSession = Depends(get_db)):
    db_invoice = models.FeeInvoice(
        student_id=invoice.student_id,
        amount=invoice.amount,
        description=invoice.description
    )
    db.add(db_invoice)
    await db.commit()
    await db.refresh(db_invoice)
    return db_invoice

@app.get("/finance/invoices/me", response_model=list[schemas.FeeInvoiceOut])
async def read_my_invoices(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.FeeInvoice).where(models.FeeInvoice.student_id == current_user.id))
    invoices = result.scalars().all()
    return [
        schemas.FeeInvoiceOut(
            id=inv.id,
            student_id=inv.student_id,
            amount=inv.amount,
            description=inv.description,
            status=inv.status,
            receipt_number=inv.receipt_number,
            paid_at=inv.paid_at.isoformat() + "Z" if inv.paid_at else None,
            due_date="2026-07-31T00:00:00Z"
        )
        for inv in invoices
    ]

@app.post("/finance/invoices/{id}/pay", response_model=schemas.FeeInvoiceOut)
async def pay_invoice(id: str, current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.FeeInvoice).where(models.FeeInvoice.id == id, models.FeeInvoice.student_id == current_user.id))
    invoice = result.scalars().first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.status == "PAID":
        raise HTTPException(status_code=400, detail="Invoice is already paid")
        
    invoice.status = "PAID"
    invoice.paid_at = datetime.utcnow()
    
    # Generate receipt number based on count
    count_res = await db.execute(select(func.count(models.FeeInvoice.id)).where(models.FeeInvoice.status == "PAID"))
    count = count_res.scalar() or 0
    invoice.receipt_number = f"RCPT-MIT-{str(count + 1).zfill(5)}"
    
    await db.commit()
    await db.refresh(invoice)
    return invoice

# --- HR ENDPOINTS ---

@app.get("/hr/faculty/profile/mega", tags=["Faculty HR"])
async def get_mega_profile(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.system_role != "FACULTY":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(models.FacultyProfile).where(models.FacultyProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
        
    return profile.mega_profile_data or {}

@app.put("/hr/faculty/profile/mega", tags=["Faculty HR"])
async def update_mega_profile(data: dict, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.system_role != "FACULTY":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(models.FacultyProfile).where(models.FacultyProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
        
    profile.mega_profile_data = data
    await db.commit()
    return {"message": "Mega profile updated successfully"}

@app.post("/hr/leaves", response_model=schemas.LeaveRequestOut)
async def apply_leave(leave: schemas.LeaveRequestCreate, current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_leave = models.LeaveRequest(
        faculty_id=current_user.id,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason
    )
    db.add(db_leave)
    await db.commit()
    await db.refresh(db_leave)
    return db_leave

@app.get("/hr/leaves", response_model=list[schemas.LeaveRequestOut])
async def read_leaves(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(models.LeaveRequest).options(selectinload(models.LeaveRequest.faculty), selectinload(models.LeaveRequest.approved_by))
    if current_user.system_role == "HOD":
        stmt = stmt.join(models.User, models.LeaveRequest.faculty_id == models.User.id).where(models.User.department_id == current_user.department_id)
    result = await db.execute(stmt.order_by(models.LeaveRequest.id.desc()))
    return result.scalars().all()

@app.put("/hr/leaves/{id}/approve", response_model=schemas.LeaveRequestOut)
async def approve_leave(id: str, status: str = "APPROVED", current_user: models.User = Depends(require_role(["HOD", "PRINCIPAL", "SUPER_ADMIN"])), db: AsyncSession = Depends(get_db)):
    if status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be APPROVED or REJECTED.")

    result = await db.execute(select(models.LeaveRequest).where(models.LeaveRequest.id == id))
    leave = result.scalars().first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if current_user.system_role == "HOD":
        res_fac = await db.execute(select(models.User).where(models.User.id == leave.faculty_id))
        faculty = res_fac.scalars().first()
        if not faculty or faculty.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="HOD can only approve leaves of faculty members in their own department")

    leave.status = status
    leave.approved_by_id = current_user.id
    await db.commit()
    
    result = await db.execute(
        select(models.LeaveRequest)
        .options(selectinload(models.LeaveRequest.faculty), selectinload(models.LeaveRequest.approved_by))
        .where(models.LeaveRequest.id == id)
    )
    return result.scalars().first()

# --- ACADEMICS ENDPOINTS ---

@app.post("/academics/courses", response_model=schemas.CourseOut)
async def create_course(course: schemas.CourseCreate, current_user: models.User = Depends(require_role(["ADMIN", "SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD"])), db: AsyncSession = Depends(get_db)):
    db_course = models.Course(**course.dict())
    db.add(db_course)
    await db.commit()
    await db.refresh(db_course)
    return db_course

@app.get("/academics/courses", response_model=list[schemas.CourseOut])
async def read_courses(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Course))
    return result.scalars().all()

@app.get("/academics/timetable/faculty/me", response_model=list[schemas.TimetableSlotOut])
async def read_my_schedule(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Assuming the current_user is a faculty
    result = await db.execute(
        select(models.TimetableSlot)
        .join(models.CourseOffering)
        .where(models.CourseOffering.faculty_id == current_user.id)
        .options(
            selectinload(models.TimetableSlot.offering).selectinload(models.CourseOffering.course),
            selectinload(models.TimetableSlot.offering).selectinload(models.CourseOffering.faculty),
            selectinload(models.TimetableSlot.classroom)
        )
    )
    return result.scalars().all()

@app.get("/academics/timetable/student/me", response_model=list[schemas.TimetableSlotOut])
async def get_student_timetable(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.system_role != "STUDENT":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(
        select(models.TimetableSlot)
        .join(models.CourseOffering)
        .join(models.Course)
        .where(models.Course.department_id == current_user.department_id)
        .options(
            selectinload(models.TimetableSlot.offering).selectinload(models.CourseOffering.course),
            selectinload(models.TimetableSlot.offering).selectinload(models.CourseOffering.faculty),
            selectinload(models.TimetableSlot.classroom)
        )
    )
    return result.scalars().all()

@app.post("/academics/attendance/mark")
async def mark_attendance(payload: schemas.AttendanceBulk, current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Faculty marks attendance
    for record in payload.records:
        # Check if record already exists to avoid duplicates
        existing = await db.execute(
            select(models.AttendanceRecord)
            .where(
                models.AttendanceRecord.slot_id == payload.slot_id,
                models.AttendanceRecord.student_id == record.student_id,
                models.AttendanceRecord.date == payload.date
            )
        )
        db_rec = existing.scalars().first()
        if db_rec:
            db_rec.is_present = record.is_present
        else:
            db_rec = models.AttendanceRecord(
                slot_id=payload.slot_id,
                student_id=record.student_id,
                date=payload.date,
                is_present=record.is_present
            )
            db.add(db_rec)
            
    await db.commit()
    return {"status": "success"}

@app.get("/academics/attendance/student/me")
async def read_my_attendance(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Calculate %
    result = await db.execute(select(models.AttendanceRecord).where(models.AttendanceRecord.student_id == current_user.id))
    records = result.scalars().all()
    if not records:
        return {"percentage": 100.0, "total": 0, "present": 0}
        
    present_count = sum(1 for r in records if r.is_present)
    percentage = (present_count / len(records)) * 100
    
    return {
        "percentage": round(percentage, 2),
        "total": len(records),
        "present": present_count
    }

# --- PHASE 5 & 6 ENDPOINTS ---

@app.post("/exams/marks", response_model=schemas.ExamResultOut)
async def submit_marks(marks: schemas.ExamResultCreate, current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    total = marks.ise_marks + marks.ese_marks
    
    # Simple Relative Grading Logic (mocked threshold for simplicity)
    grade = 'F'
    if total >= 90: grade = 'A+'
    elif total >= 80: grade = 'A'
    elif total >= 70: grade = 'B'
    elif total >= 60: grade = 'C'
    elif total >= 50: grade = 'D'
    
    db_result = models.ExamResult(
        student_id=marks.student_id,
        course_id=marks.course_id,
        semester=marks.semester,
        ise_marks=marks.ise_marks,
        ese_marks=marks.ese_marks,
        total_marks=total,
        grade=grade
    )
    db.add(db_result)
    
    # Also recalculate CGPA on the profile (mocked update)
    prof_res = await db.execute(select(models.StudentProfile).where(models.StudentProfile.user_id == marks.student_id))
    profile = prof_res.scalars().first()
    if profile:
        profile.cgpa = str(round((float(profile.cgpa) + (total / 10)) / 2, 2)) if profile.cgpa != "0.0" else str(round(total / 10, 2))
        
    await db.commit()
    
    # Fetch with course relation
    res = await db.execute(select(models.ExamResult).where(models.ExamResult.id == db_result.id).options(selectinload(models.ExamResult.course)))
    return res.scalars().first()

@app.get("/exams/student/me")
async def my_exams(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.ExamRecord)
        .where(models.ExamRecord.student_id == current_user.id)
        .options(selectinload(models.ExamRecord.course))
    )
    records = result.scalars().all()
    # Format response cleanly
    return [
        {
            "id": r.id,
            "exam_type": r.exam_type,
            "marks_obtained": r.marks_obtained,
            "max_marks": r.max_marks,
            "is_published": r.is_published,
            "cryptographic_hash": r.cryptographic_hash,
            "course": {
                "id": r.course.id,
                "code": r.course.code,
                "name": r.course.name,
                "credits": r.course.credits
            } if r.course else None
        }
        for r in records
    ]

@app.post("/placements/drives", response_model=schemas.PlacementDriveOut)
async def create_drive(drive: schemas.PlacementDriveCreate, current_user: models.User = Depends(require_role(["PLACEMENT_OFFICER", "SUPER_ADMIN"])), db: AsyncSession = Depends(get_db)):
    db_drive = models.PlacementDrive(**drive.dict())
    db.add(db_drive)
    await db.commit()
    await db.refresh(db_drive)
    return db_drive



@app.post("/campus/gatepass", response_model=schemas.GatepassRequestOut)
async def request_gatepass(gp: schemas.GatepassRequestCreate, current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_gp = models.GatepassRequest(
        student_id=current_user.id,
        reason=gp.reason,
        out_date=gp.out_date,
        in_date=gp.in_date
    )
    db.add(db_gp)
    await db.commit()
    await db.refresh(db_gp)
    return db_gp

@app.get("/campus/gatepass", response_model=list[schemas.GatepassRequestOut])
async def list_gatepasses(current_user: models.User = Depends(require_role(["ADMIN", "SUPER_ADMIN", "SECURITY_OFFICER"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.GatepassRequest).options(selectinload(models.GatepassRequest.student)))
    return result.scalars().all()

@app.put("/campus/gatepass/{id}/approve")
async def approve_gatepass(id: str, current_user: models.User = Depends(require_role(["ADMIN", "SUPER_ADMIN", "SECURITY_OFFICER", "HOSTEL_WARDEN"])), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(models.GatepassRequest).where(models.GatepassRequest.id == id))
    gp = res.scalars().first()
    if gp:
        gp.status = "APPROVED"
        await db.commit()
    return {"status": "success"}

# --- NEW FUNCTIONAL PARITY ROUTES ---

@app.get("/bulletin", response_model=list[schemas.BulletinPostOut])
async def get_bulletin_posts(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    result = await db.execute(
        select(models.BulletinPost)
        .options(selectinload(models.BulletinPost.author))
        .order_by(models.BulletinPost.created_at.desc())
        .limit(50)
    )
    posts = result.scalars().all()
    
    out = []
    for p in posts:
        name = f"{p.author.first_name} {p.author.last_name}" if p.author else "Campus User"
        role = ROLE_MAP.get(p.author.system_role, "Staff") if p.author else "Staff"
        out.append(schemas.BulletinPostOut(
            id=p.id,
            content=p.content,
            created_at=p.created_at,
            author_id=p.author_id,
            author_name=name,
            author_role=role,
            attachment_url=p.attachment_url,
            attachment_type=p.attachment_type
        ))
    return out

@app.post("/bulletin", response_model=schemas.BulletinPostOut)
async def create_bulletin_post(post: schemas.BulletinPostCreate, current_user: models.User = Depends(require_role(["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "REGISTRAR", "EXAM_CONTROLLER", "ACCOUNTS", "PLACEMENT_OFFICER", "HOD", "FACULTY"])), db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    db_post = models.BulletinPost(
        author_id=current_user.id,
        content=post.content,
        created_at=datetime.utcnow().isoformat() + "Z",
        attachment_url=post.attachment_url,
        attachment_type=post.attachment_type
    )
    db.add(db_post)
    await db.commit()
    await db.refresh(db_post)
    
    name = f"{current_user.first_name} {current_user.last_name}"
    role = ROLE_MAP.get(current_user.system_role, "Staff")
    
    return schemas.BulletinPostOut(
        id=db_post.id,
        content=db_post.content,
        created_at=db_post.created_at,
        author_id=db_post.author_id,
        author_name=name,
        author_role=role,
        attachment_url=db_post.attachment_url,
        attachment_type=db_post.attachment_type
    )

@app.get("/job-tray/me")
async def get_job_tray(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    tray = {
        "pending_leaves": 0,
        "pending_requisitions": 0,
        "missed_punches": 0,
    }
    
    if current_user.system_role == "HOD":
        stmt_leaves = (
            select(func.count(models.LeaveRequest.id))
            .join(models.User, models.LeaveRequest.faculty_id == models.User.id)
            .where(
                models.LeaveRequest.status == "PENDING",
                models.User.department_id == current_user.department_id
            )
        )
        tray["pending_leaves"] = await db.scalar(stmt_leaves) or 0
        
        stmt_reqs = (
            select(func.count(models.RequisitionTicket.id))
            .where(models.RequisitionTicket.status == "PENDING")
        )
        tray["pending_requisitions"] = await db.scalar(stmt_reqs) or 0
        
    elif current_user.system_role in ["PRINCIPAL", "SUPER_ADMIN", "REGISTRAR"]:
        stmt_leaves = (
            select(func.count(models.LeaveRequest.id))
            .where(models.LeaveRequest.status == "PENDING")
        )
        tray["pending_leaves"] = await db.scalar(stmt_leaves) or 0
        
        stmt_reqs = (
            select(func.count(models.RequisitionTicket.id))
            .where(models.RequisitionTicket.status == "PENDING")
        )
        tray["pending_requisitions"] = await db.scalar(stmt_reqs) or 0
    else:
        stmt_reqs = (
            select(func.count(models.RequisitionTicket.id))
            .where(
                models.RequisitionTicket.requester_id == current_user.id,
                models.RequisitionTicket.status == "PENDING"
            )
        )
        tray["pending_requisitions"] = await db.scalar(stmt_reqs) or 0

    return tray

@app.post("/requisitions", response_model=schemas.RequisitionTicketOut)
async def create_requisition(req: schemas.RequisitionTicketCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_req = models.RequisitionTicket(
        requester_id=current_user.id,
        ticket_type=req.ticket_type,
        description=req.description
    )
    db.add(db_req)
    await db.commit()
    await db.refresh(db_req)
    return db_req

# --- PHASE 9: ADVANCED ROUTES ---

@app.post("/users/me/switch-role")
async def switch_role(target_role: str, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verify the user actually holds this role in additional_roles (or it is their current primary)
    roles = current_user.additional_roles or []
    if target_role != current_user.system_role and target_role not in roles:
        raise HTTPException(status_code=403, detail="Role not authorized for this user")
    
    # Swap primary role with the target role
    if target_role != current_user.system_role:
        if current_user.system_role not in roles:
            roles.append(current_user.system_role)
        roles.remove(target_role) if target_role in roles else None
        
        current_user.system_role = target_role
        current_user.additional_roles = roles
        await db.commit()
    return {"status": "success", "active_role": current_user.system_role}

# 1. EXAMINATIONS
import hashlib
from datetime import datetime
from pydantic import BaseModel

@app.post("/exams/records")
async def save_exam_mark(record: schemas.ExamRecordCreate, current_user: models.User = Depends(require_role(["FACULTY", "EXAM_CONTROLLER", "SUPER_ADMIN"])), db: AsyncSession = Depends(get_db)):
    # Check if record already exists
    res = await db.execute(select(models.ExamRecord).where(
        models.ExamRecord.student_id == record.student_id,
        models.ExamRecord.course_id == record.course_id,
        models.ExamRecord.exam_type == record.exam_type
    ))
    db_record = res.scalars().first()
    
    if db_record:
        if db_record.is_published:
            raise HTTPException(status_code=403, detail="Exams are frozen and cryptographically locked. Cannot edit.")
        # Audit Trail
        audit_log = models.ExamAuditLog(
            exam_record_id=db_record.id,
            changed_by_id=current_user.id,
            previous_marks=db_record.marks_obtained,
            new_marks=record.marks_obtained,
            timestamp=datetime.utcnow().isoformat() + "Z",
            ip_address="internal"
        )
        db.add(audit_log)
        db_record.marks_obtained = record.marks_obtained
    else:
        db_record = models.ExamRecord(**record.dict())
        db.add(db_record)
        
    await db.commit()

    # Sync to ExamResult (Phase 5/6 model) and Recalculate CGPA (Criticism Point 7 & 9)
    res_records = await db.execute(
        select(models.ExamRecord).where(
            models.ExamRecord.student_id == record.student_id,
            models.ExamRecord.course_id == record.course_id
        )
    )
    all_course_records = res_records.scalars().all()
    
    ise_sum = sum(r.marks_obtained for r in all_course_records if "ISE" in r.exam_type)
    ese_val = sum(r.marks_obtained for r in all_course_records if "ESE" in r.exam_type)
    total_val = ise_sum + ese_val
    
    # Grading Criteria
    grade_val = 'F'
    if total_val >= 90: grade_val = 'A+'
    elif total_val >= 80: grade_val = 'A'
    elif total_val >= 70: grade_val = 'B'
    elif total_val >= 60: grade_val = 'C'
    elif total_val >= 50: grade_val = 'D'
    
    res_result = await db.execute(
        select(models.ExamResult).where(
            models.ExamResult.student_id == record.student_id,
            models.ExamResult.course_id == record.course_id
        )
    )
    db_result = res_result.scalars().first()
    
    if db_result:
        db_result.ise_marks = ise_sum
        db_result.ese_marks = ese_val
        db_result.total_marks = total_val
        db_result.grade = grade_val
    else:
        db_result = models.ExamResult(
            student_id=record.student_id,
            course_id=record.course_id,
            semester=1, 
            ise_marks=ise_sum,
            ese_marks=ese_val,
            total_marks=total_val,
            grade=grade_val
        )
        db.add(db_result)
        
    await db.commit()

    # Recalculate CGPA on the profile mathematically correctly (Criticism Point 9)
    prof_res = await db.execute(select(models.StudentProfile).where(models.StudentProfile.user_id == record.student_id))
    profile = prof_res.scalars().first()
    if profile:
        all_results_res = await db.execute(select(models.ExamResult).where(models.ExamResult.student_id == record.student_id))
        all_results = all_results_res.scalars().all()
        if all_results:
            cgpa_sum = sum((r.total_marks / 10.0) for r in all_results if r.total_marks is not None)
            new_cgpa = round(cgpa_sum / len(all_results), 2)
            profile.cgpa = str(max(0.0, min(10.0, new_cgpa)))
            await db.commit()

    return {"status": "saved", "id": db_record.id}

@app.post("/exams/publish")
async def publish_exams(course_id: Optional[str] = None, exam_type: Optional[str] = None, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.system_role not in ["EXAM_CONTROLLER", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Exam Controller can freeze and publish grades.")
        
    query = select(models.ExamRecord).where(models.ExamRecord.is_published == False)
    if course_id:
        query = query.where(models.ExamRecord.course_id == course_id)
    if exam_type:
        query = query.where(models.ExamRecord.exam_type == exam_type)
        
    res = await db.execute(query)
    records = res.scalars().all()
    
    # Cryptographic freeze protocol
    salt = "SUTRA_OS_SECURE_SALT_99"
    for r in records:
        r.is_published = True
        hash_string = f"{r.id}:{r.student_id}:{r.marks_obtained}:{salt}"
        r.cryptographic_hash = hashlib.sha256(hash_string.encode()).hexdigest()
        
    await db.commit()
    return {"status": "published_and_locked", "records_published": len(records)}

@app.get("/scholarships")
async def get_scholarships(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.system_role == "STUDENT":
        res = await db.execute(select(models.ScholarshipLedger).where(models.ScholarshipLedger.student_id == current_user.id))
    else:
        res = await db.execute(select(models.ScholarshipLedger))
    return res.scalars().all()

@app.post("/scholarships")
async def apply_scholarship(sch: schemas.ScholarshipCreate, current_user: models.User = Depends(require_role(["STUDENT", "REGISTRAR", "SUPER_ADMIN"])), db: AsyncSession = Depends(get_db)):
    db_sch = models.ScholarshipLedger(**sch.dict(), status="PENDING_SCHOLARSHIP_SECTION")
    db.add(db_sch)
    await db.commit()
    return {"status": "created", "state": db_sch.status}

@app.post("/scholarships/{id}/approve-section")
async def approve_scholarship_section(id: str, current_user: models.User = Depends(require_role(["REGISTRAR", "HOD", "SUPER_ADMIN"])), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(models.ScholarshipLedger).where(models.ScholarshipLedger.id == id))
    sch = res.scalars().first()
    if sch and sch.status == "PENDING_SCHOLARSHIP_SECTION":
        sch.status = "PENDING_ACCOUNTS"
        sch.scholarship_officer_id = current_user.id
        await db.commit()
    return {"status": "success", "new_state": sch.status if sch else None}

@app.post("/scholarships/{id}/approve-accounts")
async def approve_scholarship_accounts(id: str, current_user: models.User = Depends(require_role(["ACCOUNTS", "SUPER_ADMIN", "PRINCIPAL"])), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(models.ScholarshipLedger).where(models.ScholarshipLedger.id == id))
    sch = res.scalars().first()
    if sch and sch.status == "PENDING_ACCOUNTS":
        sch.status = "APPROVED"
        sch.accounts_officer_id = current_user.id
        await db.commit()
    return {"status": "success", "new_state": sch.status if sch else None}


# 3. PLACEMENTS
@app.post("/placements/apply")
async def apply_drive(drive_id: str, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(require_role(["STUDENT"]))):
    result_student = await db.execute(
        select(models.StudentProfile).where(models.StudentProfile.user_id == current_user.id)
    )
    student = result_student.scalars().first()
    if not student:
        raise HTTPException(status_code=400, detail="Only students with a profile can apply for placement drives")

    result_drive = await db.execute(
        select(models.PlacementDrive).where(models.PlacementDrive.id == drive_id)
    )
    drive = result_drive.scalars().first()
    if not drive:
        raise HTTPException(status_code=404, detail="Placement drive not found")

    try:
        student_cgpa = float(student.cgpa)
    except Exception:
        student_cgpa = 0.0

    if student_cgpa < drive.min_cgpa:
        raise HTTPException(
            status_code=400,
            detail=f"Ineligible: Your CGPA ({student_cgpa}) is below the minimum required CGPA ({drive.min_cgpa}) for this drive."
        )

    if drive.eligible_departments:
        allowed_depts = [d.strip().upper() for d in drive.eligible_departments.split(",")]
        result_dept = await db.execute(select(models.Department).where(models.Department.id == current_user.department_id))
        dept = result_dept.scalars().first()
        if not dept or dept.code.upper() not in allowed_depts:
            raise HTTPException(
                status_code=400,
                detail=f"Ineligible: Your department ({dept.code if dept else 'N/A'}) is not eligible for this drive."
            )

    result_exist = await db.execute(
        select(models.PlacementApplication).where(
            models.PlacementApplication.drive_id == drive_id,
            models.PlacementApplication.student_id == current_user.id
        )
    )
    if result_exist.scalars().first():
        raise HTTPException(status_code=400, detail="You have already applied for this placement drive")

    app = models.PlacementApplication(drive_id=drive_id, student_id=current_user.id)
    db.add(app)
    await db.commit()
    return {"status": "applied"}

@app.get("/placements/drives", response_model=list[schemas.PlacementDriveOut])
async def get_drives(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    res = await db.execute(select(models.PlacementDrive).order_by(models.PlacementDrive.drive_date.asc()))
    return res.scalars().all()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
