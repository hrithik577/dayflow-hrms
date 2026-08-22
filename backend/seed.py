import sys
import os
from datetime import date, datetime, timedelta, time
import random

# Ensure local app package takes precedence over global site-packages
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.employee import Employee, EmploymentStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveType, LeaveRequest, LeaveBalance, LeaveRequestStatus
from app.models.payroll import Payroll
from app.models.policy import Policy
from app.models.audit import AuditLog, Notification
from app.models.ai import AIInsight, AIEvent, AttendanceAnomaly

def seed_database():
    print("🌱 Initializing Dayflow Database Seed...")
    
    # Ensure tables exist without dropping existing data
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if database is already seeded
        existing_user = db.query(User).first()
        if existing_user:
            print("  ℹ Database already contains seeded data. Skipping seed generation to protect existing data.")
            return

        # 1. Create Departments
        print("  - Creating Departments...")
        departments_data = [
            {"name": "Engineering", "code": "ENG"},
            {"name": "Human Resources", "code": "HRD"},
            {"name": "Finance & Accounting", "code": "FIN"},
            {"name": "Sales & Marketing", "code": "SAL"},
            {"name": "Operations", "code": "OPS"},
        ]
        
        departments = {}
        for d in departments_data:
            existing_dept = db.query(Department).filter(Department.code == d["code"]).first()
            if not existing_dept:
                existing_dept = Department(name=d["name"], code=d["code"])
                db.add(existing_dept)
                db.commit()
                db.refresh(existing_dept)
            departments[d["name"]] = existing_dept

        # 2. Create Leave Types
        print("  - Creating Leave Types...")
        leave_types = [
            {"name": "Paid Annual Leave", "code": "PAID", "max_days_per_year": 18, "description": "Standard paid vacation leave"},
            {"name": "Sick Leave", "code": "SICK", "max_days_per_year": 12, "description": "Medical and health leave"},
            {"name": "Casual Leave", "code": "CASUAL", "max_days_per_year": 8, "description": "Short notice personal leave"},
            {"name": "Unpaid Leave", "code": "UNPAID", "max_days_per_year": 30, "description": "Leave without pay"},
        ]
        for lt_data in leave_types:
            existing_lt = db.query(LeaveType).filter(LeaveType.code == lt_data["code"]).first()
            if not existing_lt:
                existing_lt = LeaveType(**lt_data)
                db.add(existing_lt)
        db.commit()
        
        lt_map = {lt.code: lt for lt in db.query(LeaveType).all()}

        # 3. Create Admin User & Profile
        print("  - Creating Admin & HR Accounts...")
        admin_user = User(
            employee_id="ADM-0001",
            email="admin@dayflow.com",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.ADMIN,
            email_verified=True,
            is_active=True
        )
        db.add(admin_user)
        db.commit()

        admin_emp = Employee(
            user_id=admin_user.id,
            employee_code="ADM-0001",
            first_name="Victor",
            last_name="Vance",
            phone="+1 (555) 019-2831",
            address="100 Enterprise Way",
            city="San Francisco",
            department_id=departments["Operations"].id,
            designation="Chief Operations Officer & System Admin",
            joining_date=date(2022, 1, 15),
            employment_status=EmploymentStatus.ACTIVE
        )
        db.add(admin_emp)
        db.commit()

        # 4. Create HR Users & Profiles
        hr1_user = User(
            employee_id="HR-0001",
            email="hr.sarah@dayflow.com",
            password_hash=get_password_hash("HR@123"),
            role=UserRole.HR,
            email_verified=True,
            is_active=True
        )
        db.add(hr1_user)
        db.commit()

        hr1_emp = Employee(
            user_id=hr1_user.id,
            employee_code="HR-0001",
            first_name="Sarah",
            last_name="Jenkins",
            phone="+1 (555) 018-9922",
            address="450 Park Avenue",
            city="San Francisco",
            department_id=departments["Human Resources"].id,
            designation="Senior HR Operations Manager",
            joining_date=date(2023, 3, 1),
            employment_status=EmploymentStatus.ACTIVE
        )
        db.add(hr1_emp)
        db.commit()

        hr2_user = User(
            employee_id="HR-0002",
            email="hr.alex@dayflow.com",
            password_hash=get_password_hash("HR@123"),
            role=UserRole.HR,
            email_verified=True,
            is_active=True
        )
        db.add(hr2_user)
        db.commit()

        hr2_emp = Employee(
            user_id=hr2_user.id,
            employee_code="HR-0002",
            first_name="Alex",
            last_name="Mercer",
            phone="+1 (555) 017-3344",
            address="720 Mission Street",
            city="San Francisco",
            department_id=departments["Human Resources"].id,
            designation="HR Business Partner",
            joining_date=date(2023, 6, 15),
            employment_status=EmploymentStatus.ACTIVE
        )
        db.add(hr2_emp)
        db.commit()

        # 5. Create 25 Realistic Employees
        print("  - Creating Employee Accounts & Profiles...")
        sample_employees = [
            ("Rahul", "Sharma", "rahul.sharma@dayflow.com", "Engineering", "Senior Full-Stack Engineer", 120000),
            ("Priya", "Patel", "priya.patel@dayflow.com", "Engineering", "Backend Architect", 135000),
            ("Aarav", "Mehta", "aarav.mehta@dayflow.com", "Engineering", "Frontend Specialist", 110000),
            ("Neha", "Gupta", "neha.gupta@dayflow.com", "Engineering", "DevOps & Cloud Engineer", 125000),
            ("Vikram", "Rao", "vikram.rao@dayflow.com", "Engineering", "QA & Automation Engineer", 95000),
            ("Ananya", "Deshmukh", "ananya.d@dayflow.com", "Engineering", "AI/ML Engineer", 130000),
            ("Karan", "Verma", "karan.verma@dayflow.com", "Finance & Accounting", "Senior Financial Analyst", 105000),
            ("Rohan", "Kapoor", "rohan.kapoor@dayflow.com", "Finance & Accounting", "Payroll Lead", 90000),
            ("Sneha", "Reddy", "sneha.reddy@dayflow.com", "Finance & Accounting", "Staff Accountant", 80000),
            ("Dev", "Nair", "dev.nair@dayflow.com", "Sales & Marketing", "VP of Global Sales", 160000),
            ("Ishita", "Roy", "ishita.roy@dayflow.com", "Sales & Marketing", "Enterprise Account Executive", 115000),
            ("Aditya", "Joshi", "aditya.joshi@dayflow.com", "Sales & Marketing", "Growth Marketing Lead", 100000),
            ("Kavya", "Iyer", "kavya.iyer@dayflow.com", "Sales & Marketing", "Content Strategy Lead", 88000),
            ("Siddharth", "Chopra", "siddharth.c@dayflow.com", "Operations", "Director of Operations", 140000),
            ("Pooja", "Bhatia", "pooja.bhatia@dayflow.com", "Operations", "Supply Chain Lead", 98000),
            ("Manish", "Tiwari", "manish.tiwari@dayflow.com", "Operations", "Office Manager", 75000),
            ("Tanvi", "Saxena", "tanvi.saxena@dayflow.com", "Human Resources", "Talent Acquisition Lead", 92000),
            ("Rishi", "Malhotra", "rishi.m@dayflow.com", "Human Resources", "People Operations Specialist", 82000),
            ("Meera", "Kulkarni", "meera.k@dayflow.com", "Engineering", "UI/UX Designer", 105000),
            ("Arjun", "Sen", "arjun.sen@dayflow.com", "Engineering", "Database Specialist", 125000),
            ("Bhavna", "Pandey", "bhavna.p@dayflow.com", "Sales & Marketing", "Sales Operations Lead", 94000),
            ("Gautam", "Singhal", "gautam.s@dayflow.com", "Operations", "Logistics Coordinator", 72000),
            ("Divya", "Menon", "divya.menon@dayflow.com", "Finance & Accounting", "Audit Specialist", 98000),
            ("Kabir", "Das", "kabir.das@dayflow.com", "Engineering", "Security Engineer", 132000),
            ("Nisha", "Bansal", "nisha.b@dayflow.com", "Sales & Marketing", "Customer Success Lead", 90000),
        ]

        employee_objects = []
        for i, (fn, ln, email, dept_name, desig, annual_sal) in enumerate(sample_employees, start=101):
            emp_code = f"EMP-{i:04d}"
            usr = User(
                employee_id=emp_code,
                email=email,
                password_hash=get_password_hash("Emp@123"),
                role=UserRole.EMPLOYEE,
                email_verified=True,
                is_active=True
            )
            db.add(usr)
            db.commit()

            emp = Employee(
                user_id=usr.id,
                employee_code=emp_code,
                first_name=fn,
                last_name=ln,
                phone=f"+1 (555) 019-{i:04d}",
                address=f"{100+i} Market Street",
                city="San Francisco",
                department_id=departments[dept_name].id,
                designation=desig,
                joining_date=date(2023, random.randint(1, 12), random.randint(1, 28)),
                employment_status=EmploymentStatus.ACTIVE
            )
            db.add(emp)
            db.commit()
            employee_objects.append(emp)

            # Assign Payroll
            monthly_basic = round(annual_sal / 12.0 * 0.7, 2)
            monthly_allowance = round(annual_sal / 12.0 * 0.2, 2)
            monthly_deduction = round(annual_sal / 12.0 * 0.1, 2)
            net_sal = round(monthly_basic + monthly_allowance - monthly_deduction, 2)

            pay = Payroll(
                employee_id=emp.id,
                basic_salary=monthly_basic,
                allowances=monthly_allowance,
                deductions=monthly_deduction,
                net_salary=net_sal,
                effective_from=date(2024, 1, 1),
                currency="USD"
            )
            db.add(pay)

            # Assign Leave Balances
            for lt in leave_types:
                lb = LeaveBalance(
                    employee_id=emp.id,
                    leave_type_id=lt.id,
                    allocated_days=lt.annual_limit,
                    used_days=random.randint(0, 3),
                    remaining_days=lt.annual_limit - 2
                )
                db.add(lb)

        db.commit()

        # 6. Create 30 Days of Historical Attendance
        print("  - Generating 30 Days of Historical Attendance...")
        today = date.today()
        all_emps = [admin_emp, hr1_emp, hr2_emp] + employee_objects

        for day_offset in range(30, -1, -1):
            curr_date = today - timedelta(days=day_offset)
            if curr_date.weekday() >= 5: # Skip weekends
                continue

            for emp in all_emps:
                # Deterministic check-in variance
                rand_val = random.random()
                if rand_val < 0.82:
                    # Present on time (08:45 AM - 09:25 AM)
                    base_t = datetime.combine(curr_date, time(8, 45)) + timedelta(minutes=random.randint(0, 35))
                    c_in_time = base_t
                    c_out_time = base_t + timedelta(hours=8, minutes=random.randint(15, 45))
                    st = AttendanceStatus.PRESENT
                    wh = round((c_out_time - c_in_time).total_seconds() / 3600.0, 2)
                elif rand_val < 0.93:
                    # Late arrival (09:35 AM - 10:15 AM)
                    base_t = datetime.combine(curr_date, time(9, 35)) + timedelta(minutes=random.randint(0, 35))
                    c_in_time = base_t
                    c_out_time = base_t + timedelta(hours=8, minutes=random.randint(10, 30))
                    st = AttendanceStatus.LATE
                    wh = round((c_out_time - c_in_time).total_seconds() / 3600.0, 2)
                elif rand_val < 0.97:
                    # On Leave
                    c_in_time = None
                    c_out_time = None
                    st = AttendanceStatus.LEAVE
                    wh = 0.0
                else:
                    # Absent
                    c_in_time = None
                    c_out_time = None
                    st = AttendanceStatus.ABSENT
                    wh = 0.0

                att = Attendance(
                    employee_id=emp.id,
                    date=curr_date,
                    check_in=c_in_time,
                    check_out=c_out_time,
                    status=st,
                    working_hours=wh,
                    source="WEB"
                )
                db.add(att)

        db.commit()

        # 7. Create Sample Leave Requests
        print("  - Generating Sample Leave Requests...")
        target_rahul = next(e for e in employee_objects if e.first_name == "Rahul")
        target_priya = next(e for e in employee_objects if e.first_name == "Priya")
        target_dev = next(e for e in employee_objects if e.first_name == "Dev")

        # Rahul's Pending Sick Leave
        l_req1 = LeaveRequest(
            employee_id=target_rahul.id,
            leave_type_id=lt_map["SICK"].id,
            start_date=today + timedelta(days=2),
            end_date=today + timedelta(days=4),
            total_days=3.0,
            reason="Recovering from viral fever",
            status=LeaveRequestStatus.PENDING
        )
        db.add(l_req1)

        # Priya's Approved Annual Leave
        l_req2 = LeaveRequest(
            employee_id=target_priya.id,
            leave_type_id=lt_map["PAID"].id,
            start_date=today - timedelta(days=5),
            end_date=today - timedelta(days=2),
            total_days=4.0,
            reason="Family vacation in Hawaii",
            status=LeaveRequestStatus.APPROVED,
            reviewed_by=hr1_emp.id,
            reviewer_comment="Approved. Coverage confirmed by engineering team."
        )
        db.add(l_req2)

        # Dev's Approved Casual Leave
        l_req3 = LeaveRequest(
            employee_id=target_dev.id,
            leave_type_id=lt_map["CASUAL"].id,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=6),
            total_days=2.0,
            reason="Attending industry sales conference",
            status=LeaveRequestStatus.PENDING
        )
        db.add(l_req3)

        db.commit()

        # 8. Create Sample Policies
        print("  - Generating HR Policies...")
        policies = [
            Policy(
                policy_name="Standard Leave & Time-Off Policy",
                category="LEAVE",
                content="Employees receive paid leave, sick leave, and casual leave allotments annually. All leave requests spanning more than 2 consecutive days must be submitted at least 48 hours in advance for manager and HR approval.",
                role_visibility="ALL",
                version="2.1"
            ),
            Policy(
                policy_name="Attendance & Work Hours Policy",
                category="ATTENDANCE",
                content="Standard business hours are 09:00 AM to 05:00 PM. Check-ins recorded after 09:30 AM are automatically flagged as LATE. Repeated late arrivals (3+ per 14 days) trigger an automated HR review.",
                role_visibility="ALL",
                version="1.4"
            ),
            Policy(
                policy_name="Payroll & Compensation Framework",
                category="PAYROLL",
                content="Payroll disbursements occur on the 1st business day of each calendar month. Basic salary constitutes 70% of total compensation package. Individual salary figures are strictly confidential.",
                role_visibility="ALL",
                version="3.0"
            )
        ]
        for p in policies:
            db.add(p)
        db.commit()

        # 9. Create Seed Audit & AI Events
        print("  - Generating Audit Logs & AI Insights...")
        audit_records = [
            AuditLog(user_id=admin_user.id, role="ADMIN", action="SYSTEM_INIT", new_value="Dayflow platform initialized with seed database."),
            AuditLog(user_id=hr1_user.id, role="HR", action="APPROVE_LEAVE_REQUEST", entity_type="LEAVE_REQUEST", entity_id="2", new_value="Approved leave for Priya Patel."),
            AuditLog(user_id=target_rahul.user_id, role="EMPLOYEE", action="ATTENDANCE_CHECK_IN", new_value="Checked in at 09:02 AM"),
            AuditLog(user_id=target_rahul.user_id, role="EMPLOYEE", action="CREATE_LEAVE_REQUEST", entity_type="LEAVE_REQUEST", entity_id="1", new_value="Submitted sick leave request for 3 days."),
        ]
        for a in audit_records:
            db.add(a)

        # AI Insight Attention Signal
        insight1 = AIInsight(
            employee_id=target_rahul.id,
            department_id=target_rahul.department_id,
            insight_type="ATTENDANCE_ATTENTION",
            severity="MEDIUM",
            title=f"Workforce Attention Signal: Rahul Sharma",
            explanation="Attendance variation detected for Rahul Sharma in Engineering department.",
            evidence="Logged 4 late check-ins and 1 sick leave request in the past 14 days. Average working hours: 7.4h/day.",
            recommendation="Recommended action: 1-on-1 manager check-in to review workload and project support.",
            confidence=0.86,
            status="NEW"
        )
        db.add(insight1)
        db.commit()

        print("✅ Dayflow Database successfully seeded!")
        print("\n--- DEMO LOGIN CREDENTIALS ---")
        print("👑 ADMIN:    admin@dayflow.com    / Admin@123")
        print("👩‍💼 HR:       hr.sarah@dayflow.com / HR@123")
        print("👨‍💻 EMPLOYEE: rahul.sharma@dayflow.com / Emp@123")
        print("-------------------------------\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
