import asyncio
import bcrypt
import random
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import Base, User, Department, StudentProfile, FacultyProfile, Course, ExamRecord, ScholarshipLedger, PlacementDrive, FeeInvoice, LeaveRequest, Classroom, CourseOffering, TimetableSlot, LibraryBook, LibraryCheckout, BusRoute, TransportReservation, HostelAdmission, OffCampusPlacement, BusStop
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

import os
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./sutraos.db")

if "sqlite" in DATABASE_URL:
    engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})
else:
    engine = create_async_engine(DATABASE_URL, echo=False)

try:
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization
    HAS_CRYPTOGRAPHY = True
except ImportError:
    HAS_CRYPTOGRAPHY = False

def generate_key_pair():
    if HAS_CRYPTOGRAPHY:
        try:
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048
            )
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ).decode("utf-8")
            
            public_pem = private_key.public_key().public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode("utf-8")
            
            return private_pem, public_pem
        except Exception:
            pass
    
    # Fallback pseudo-keys
    import hashlib
    import uuid
    seed = str(uuid.uuid4())
    private_pem = f"-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_{hashlib.sha256(seed.encode()).hexdigest()}\n-----END PRIVATE KEY-----"
    public_pem = f"-----BEGIN PUBLIC KEY-----\nMOCK_PUBLIC_KEY_{hashlib.sha256((seed + '_pub').encode()).hexdigest()}\n-----END PUBLIC KEY-----"
    return private_pem, public_pem

async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Departments list
DEPARTMENTS = [
    {"code": "CSE", "name": "Computer Science & Engineering"},
    {"code": "ME", "name": "Mechanical Engineering"},
    {"code": "CE", "name": "Civil Engineering"},
    {"code": "ECE", "name": "Electronics & Telecommunication"},
    {"code": "PPE", "name": "Plastic & Polymer Engineering"},
    {"code": "AIDS", "name": "Artificial Intelligence & Data Science"},
    {"code": "CSD", "name": "Computer Science & Design"},
    {"code": "MBA", "name": "Master of Business Administration"},
    {"code": "BSH", "name": "Basic Sciences & Humanities"}
]

USERS_TO_CREATE = [
    {"username": "super_admin", "first_name": "System", "last_name": "Administrator", "role": "SUPER_ADMIN"},
    {"username": "inst_admin", "first_name": "MIT", "last_name": "Admin", "role": "INSTITUTION_ADMIN"},
    {"username": "principal", "first_name": "Dr. Nilesh", "last_name": "Patil", "role": "PRINCIPAL", "dept": "ME"},
    {"username": "registrar", "first_name": "Sachin", "last_name": "Lomte", "role": "REGISTRAR"},
    {"username": "exam_controller", "first_name": "Dr. Ganesh", "last_name": "Sable", "role": "EXAM_CONTROLLER", "dept": "ECE"},
    {"username": "accounts_head", "first_name": "Rajesh", "last_name": "Kulkarni", "role": "ACCOUNTS"},
    {"username": "placement_officer", "first_name": "Sandeep", "last_name": "Pankade", "role": "PLACEMENT_OFFICER", "dept": "ME"},
]

HODS = [
    {"username": "hod_cse", "first_name": "Prof. Bhupesh", "last_name": "Mishra", "role": "HOD", "dept": "CSE"},
    {"username": "hod_me", "first_name": "Dr. Pankaj", "last_name": "Zine", "role": "HOD", "dept": "ME"},
    {"username": "hod_ce", "first_name": "Dr. Manish", "last_name": "Dixit", "role": "HOD", "dept": "CE"},
    {"username": "hod_ece", "first_name": "Dr. Shilpa", "last_name": "Kodgire", "role": "HOD", "dept": "ECE"},
    {"username": "hod_ppe", "first_name": "Dr. Aniruddha", "last_name": "Chatterjee", "role": "HOD", "dept": "PPE"},
    {"username": "hod_aids", "first_name": "Dr. Saurabh", "last_name": "Deshmukh", "role": "HOD", "dept": "AIDS"},
    {"username": "hod_csd", "first_name": "Dr. Smita", "last_name": "Kasar", "role": "HOD", "dept": "CSD"},
    {"username": "hod_mba", "first_name": "Dr. Prashant", "last_name": "Mahajan", "role": "HOD", "dept": "MBA"},
    {"username": "hod_bsh", "first_name": "Dr. A. C.", "last_name": "Dabhole", "role": "HOD", "dept": "BSH"},
]

async def seed_data():
    import sys
    from sqlalchemy import text
    db_exists = False
    try:
        async with async_session() as session:
            res = await session.execute(text("SELECT COUNT(*) FROM users"))
            count = res.scalar()
            if count and count > 0:
                db_exists = True
    except Exception:
        pass

    force = "--force" in sys.argv
    if db_exists and not force:
        print("Database already contains data. Seeding aborted. Use '--force' flag to drop and recreate.")
        return

    # Recreate tables so schema changes are applied on disk
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session() as session:
        
        print("Cleared existing DB and created tables.")
        
        dept_map = {}
        for d in DEPARTMENTS:
            dept = Department(code=d['code'], name=d['name'])
            session.add(dept)
            await session.commit()
            await session.refresh(dept)
            dept_map[d['code']] = dept.id
            
        print("Created Departments.")
        
        default_hash = get_password_hash("password123")
        
        # 1. Core Users
        all_users = []
        for u in USERS_TO_CREATE + HODS:
            priv, pub = generate_key_pair()
            user = User(
                username=u['username'],
                hashed_password=default_hash,
                email=f"{u['username']}@mit.edu",
                system_role=u['role'],
                first_name=u['first_name'],
                last_name=u['last_name'],
                department_id=dept_map.get(u.get('dept')),
                private_key=priv,
                public_key=pub
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            all_users.append(user)
            if u['role'] in ['PRINCIPAL', 'HOD', 'EXAM_CONTROLLER', 'PLACEMENT_OFFICER']:
                fp = FacultyProfile(user_id=user.id, employee_id=f"EMP-{u['username']}")
                session.add(fp)
                
        print("Created Admin and HODs.")
        
        # 2. Add some Faculty
        faculty_users = []
        for i, dept_code in enumerate(dept_map.keys()):
            priv, pub = generate_key_pair()
            user = User(
                username=f"faculty_{dept_code.lower()}_{i}",
                hashed_password=default_hash,
                email=f"{dept_code.lower()}_fac{i}@mit.edu",
                system_role="FACULTY",
                first_name="Prof.",
                last_name=f"Faculty {dept_code}",
                department_id=dept_map[dept_code],
                private_key=priv,
                public_key=pub
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            all_users.append(user)
            faculty_users.append(user)
            fp = FacultyProfile(user_id=user.id, employee_id=f"EMP-FAC-{dept_code}-{i}")
            session.add(fp)
            
        print("Created Faculty.")
        
        # Create mock courses for Exams and Timetable
        course = Course(code="CS201", name="Data Structures", credits=4, is_elective=False, department_id=list(dept_map.values())[0])
        course_me = Course(code="ME202", name="Thermodynamics", credits=4, is_elective=False, department_id=dept_map["ME"])
        session.add_all([course, course_me])
        await session.commit()
        await session.refresh(course)
        await session.refresh(course_me)
        
        # 3. Add Students
        student_users = []
        for i in range(1, 21):
            dept_code = list(dept_map.keys())[i % len(dept_map)]
            roll = f"MIT2024{dept_code}{str(i).zfill(3)}"
            priv, pub = generate_key_pair()
            user = User(
                username=roll.lower(),
                hashed_password=default_hash,
                email=f"{roll.lower()}@mit.edu",
                system_role="STUDENT",
                first_name="Student",
                last_name=f"{i}",
                department_id=dept_map[dept_code],
                private_key=priv,
                public_key=pub
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            student_users.append(user)
            
            cgpa = str(round(random.uniform(5.5, 9.8), 2))
            sp = StudentProfile(user_id=user.id, enrollment_number=roll, current_semester=4, batch_year=2024, cgpa=cgpa, parent_whatsapp="+919876543210")
            session.add(sp)
            
        print("Created 20 Students.")
        
        # --- PHASE 9: ADVANCED DATA (Exams, Scholarships, Placements) ---
        print("Seeding Phase 9 Data (Exams, MahaDBT Scholarships, Placements)...")
        
        hod_cse = next(u for u in all_users if u.username == "hod_cse")
        accounts_user = next(u for u in all_users if u.username == "accounts_head")
        
        exam_records = [
            ExamRecord(student_id=student_users[0].id, course_id=course.id, exam_type="ISE-1", marks_obtained=18.5, max_marks=20.0),
            ExamRecord(student_id=student_users[1].id, course_id=course.id, exam_type="ISE-1", marks_obtained=14.0, max_marks=20.0),
            ExamRecord(student_id=student_users[0].id, course_id=course.id, exam_type="ESE", marks_obtained=68.0, max_marks=80.0),
            ExamRecord(student_id=student_users[2].id, course_id=course.id, exam_type="ISE-1", marks_obtained=19.0, max_marks=20.0),
        ]
        session.add_all(exam_records)
        
        scholarship_ledgers = [
            ScholarshipLedger(student_id=student_users[0].id, scholarship_name="Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna (EBC)", amount=45000, status="PENDING_SCHOLARSHIP_SECTION"),
            ScholarshipLedger(student_id=student_users[1].id, scholarship_name="Dr. Panjabrao Deshmukh Vasatigruh Nirvah Bhatta Yojna (Hostel)", amount=30000, status="PENDING_ACCOUNTS", scholarship_officer_id=hod_cse.id),
            ScholarshipLedger(student_id=student_users[2].id, scholarship_name="State Government Open Merit Scholarship", amount=5000, status="APPROVED", scholarship_officer_id=hod_cse.id, accounts_officer_id=accounts_user.id),
            ScholarshipLedger(student_id=student_users[3].id, scholarship_name="Tuition Fee Waiver Scheme (TFWS)", amount=85000, status="PENDING_SCHOLARSHIP_SECTION")
        ]
        session.add_all(scholarship_ledgers)
        
        placement_drives = [
            PlacementDrive(company_name="TCS Digital", role="System Engineer", ctc="7.0 LPA", min_cgpa=7.5, drive_date="2026-08-15", status="UPCOMING", eligible_departments="CSE, ECE, CE, ME"),
            PlacementDrive(company_name="Infosys (HackWithInfy)", role="Power Programmer", ctc="8.0 LPA", min_cgpa=7.0, drive_date="2026-08-20", status="UPCOMING", eligible_departments="CSE, ECE"),
            PlacementDrive(company_name="Reliance Jio", role="SDE-1", ctc="12.0 LPA", min_cgpa=8.0, drive_date="2026-09-05", status="UPCOMING", eligible_departments="CSE")
        ]
        session.add_all(placement_drives)

        # Seed Fee Invoices
        invoices = [
            FeeInvoice(student_id=student_users[0].id, amount=125000.0, description="Academic Year 2026 Tuition Fees", status="PENDING"),
            FeeInvoice(student_id=student_users[0].id, amount=12000.0, description="Semester 4 Exam Fee", status="PENDING"),
            FeeInvoice(student_id=student_users[1].id, amount=125000.0, description="Academic Year 2026 Tuition Fees", status="PAID", receipt_number="REC-998877", paid_at=None)
        ]
        session.add_all(invoices)

        # Seed Faculty Leave Requests
        leaves = [
            LeaveRequest(faculty_id=faculty_users[0].id, start_date="2026-07-01", end_date="2026-07-03", reason="Attending international research conference on Machine Learning.", status="PENDING"),
            LeaveRequest(faculty_id=faculty_users[1].id, start_date="2026-07-10", end_date="2026-07-11", reason="Personal medical checkup and family urgency.", status="PENDING"),
            LeaveRequest(faculty_id=faculty_users[2].id, start_date="2026-06-25", end_date="2026-06-26", reason="Casual leave for visiting hometown.", status="APPROVED", approved_by_id=hod_cse.id)
        ]
        session.add_all(leaves)

        # Seed Classrooms, CourseOfferings, and Timetable
        c1 = Classroom(room_number="Room 101", building="Main Block")
        c2 = Classroom(room_number="Room 202", building="ME Block")
        session.add_all([c1, c2])
        await session.commit()
        await session.refresh(c1)
        await session.refresh(c2)

        co1 = CourseOffering(course_id=course.id, faculty_id=faculty_users[0].id, division="A")
        co2 = CourseOffering(course_id=course_me.id, faculty_id=faculty_users[1].id, division="B")
        session.add_all([co1, co2])
        await session.commit()
        await session.refresh(co1)
        await session.refresh(co2)

        timetable = [
            TimetableSlot(offering_id=co1.id, classroom_id=c1.id, day_of_week="Monday", start_time="10:00 AM", end_time="11:00 AM"),
            TimetableSlot(offering_id=co1.id, classroom_id=c1.id, day_of_week="Wednesday", start_time="10:00 AM", end_time="11:00 AM"),
            TimetableSlot(offering_id=co2.id, classroom_id=c2.id, day_of_week="Monday", start_time="11:00 AM", end_time="12:00 PM"),
            TimetableSlot(offering_id=co2.id, classroom_id=c2.id, day_of_week="Thursday", start_time="11:00 AM", end_time="12:00 PM")
        ]
        session.add_all(timetable)
        await session.commit()

        # Seed Library Books
        books = [
            LibraryBook(title="Clean Code", author="Robert C. Martin", isbn="9780132350884", total_copies=5, available_copies=5),
            LibraryBook(title="Introduction to Algorithms", author="Thomas H. Cormen", isbn="9780262033848", total_copies=3, available_copies=3),
            LibraryBook(title="Computer Networks", author="Andrew S. Tanenbaum", isbn="9780132126953", total_copies=4, available_copies=4)
        ]
        session.add_all(books)

        # Seed Bus Stops
        stops_list = [
            "Aamkhas Maidan", "Akashvani Signal", "Ambedkar Chawk", "API CORNER", 
            "AS Club Signal", "Avishkar Colony", "Baba Petrol Pump", "Bajrang Chawk", 
            "Baliram Patil School", "Cambridge School", "Chetak Ghoda", "Chikalthana", 
            "CHIKALTHANA GAON", "Chishtiya polic station", "Cidco Bus Stop Chouk", 
            "CIDCO Garden", "CIDCO Mahanagar Stop", "Collector Office Signal", 
            "Darga Chawk", "Darga Chouk", "Dashnimukkhi Hanuman Mandir", 
            "Dhoodh Dairy Signal", "Dhoot Hospital", "Gajanan Mandir", 
            "Gajanan Mandir Reliance Mall", "Ganpati Mandir", "Hadko Corner", 
            "Hanuman Nagar", "Harsulgaon", "Himayat Bag", "Hindusthan Awas", 
            "Hira Hotel Chouk(Amrut Hospital)", "Holycross School", "Mill Corner", 
            "MIT", "MIT College", "MIT Poly Building", "Mohta Devi", "Mondha Naka", 
            "More Chawk", "Mukund Wadi", "Mukutwadi", "Nagar Naka", 
            "Nawkhanda College Bhadkal Gate", "Oasis Chawk", 
            "Old Paithan Linke Road Bajaj Gate", "Paithan road T point", 
            "Prozone Mall N-1", "Pudliknagar", "Pundlik Nagar", "Railway Station", 
            "Ram Nagar/Chikhalthana", "RamNagar", "Ranjangaon Stop", "Roplekar Hospital", 
            "Sawarkar Chauk TV Center", "SBI Bank Signal Cidco", "SBOA", 
            "South City Stop", "Sudgirni Chawk", "Sudhgirni Chawk", "T point", 
            "T.V.Center", "Vadgaon Phata", "VIT's Hotel", "Vitkheda Phata", 
            "Vutthal Mandir Pandharpur"
        ]
        db_stops = [BusStop(name=name) for name in stops_list]
        session.add_all(db_stops)
        await session.commit()

        # Seed Bus Routes
        r1 = BusRoute(route_name="Jatwada ( Sahara vaibhav) To MIT", bus_number="MH-20-EF-1010", driver_name="Satish Singh", capacity=40, reserved_seats=0)
        r2 = BusRoute(route_name="Aurangabad Station To MIT", bus_number="MH-20-GH-2020", driver_name="Ramesh Patil", capacity=40, reserved_seats=0)
        session.add_all([r1, r2])
        await session.commit()
        await session.refresh(r1)
        await session.refresh(r2)

        # Link all stops to these routes
        r1.stops = db_stops
        r2.stops = db_stops
        await session.commit()

        # Seed Hostel Admissions
        hostel_admissions = [
            HostelAdmission(student_id=student_users[0].id, room_number="101-A", block_name="Aryabhata Hostel Block", parent_consent_approved=True),
            HostelAdmission(student_id=student_users[1].id, room_number="102-B", block_name="Aryabhata Hostel Block", parent_consent_approved=False)
        ]
        session.add_all(hostel_admissions)

        await session.commit()
        print("Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
