import random
import json
import hashlib
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.orm import Session

from app.db.session import engine, Base
from app.models import (
    User, Department, Employee, Attendance, LeaveType, LeaveRequest, LeaveBalance,
    Payroll, Document, Notification, AuditLog, AIEvent, AIInsight, AttendanceAnomaly,
    WorkforceMetric, Policy
)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def seed_database(db: Session):
    print("[SEED] Starting DAYFLOW database seed...")

    # Ensure tables are created on the active session bind
    bind_target = db.get_bind() if hasattr(db, "get_bind") else engine
    Base.metadata.create_all(bind=bind_target)

    # 1. Seed Leave Types
    leave_types_data = [
        {"name": "Paid Leave", "code": "PAID", "max_days_per_year": 18, "is_paid": True, "description": "Standard annual paid leave"},
        {"name": "Sick Leave", "code": "SICK", "max_days_per_year": 10, "is_paid": True, "description": "Medical and health leave"},
        {"name": "Casual Leave", "code": "CASUAL", "max_days_per_year": 6, "is_paid": True, "description": "Personal urgent leave"},
        {"name": "Maternity Leave", "code": "MATERNITY", "max_days_per_year": 90, "is_paid": True, "description": "Maternity leave for mothers"},
        {"name": "Unpaid Leave", "code": "UNPAID", "max_days_per_year": 30, "is_paid": False, "description": "Unpaid leave of absence"},
    ]

    leave_type_objs = {}
    for lt_data in leave_types_data:
        lt = db.query(LeaveType).filter(LeaveType.code == lt_data["code"]).first()
        if not lt:
            lt = LeaveType(**lt_data)
            db.add(lt)
            db.flush()
        leave_type_objs[lt.code] = lt

    # 2. Seed Departments
    departments_data = [
        {"name": "Engineering", "code": "ENG", "description": "Product engineering and tech stack development"},
        {"name": "HR", "code": "HR", "description": "People ops, talent acquisition, and workforce management"},
        {"name": "Finance", "code": "FIN", "description": "Financial planning, accounting, and payroll"},
        {"name": "Sales", "code": "SALES", "description": "Business development and client relations"},
        {"name": "Operations", "code": "OPS", "description": "Logistics, support, and office infrastructure"},
    ]

    dept_objs = {}
    for d_data in departments_data:
        dept = db.query(Department).filter(Department.code == d_data["code"]).first()
        if not dept:
            dept = Department(**d_data)
            db.add(dept)
            db.flush()
        dept_objs[d_data["name"]] = dept

    db.commit()

    # Default password hash for demo accounts
    demo_password_hash = hash_password("Dayflow@2026")

    # 3. Admin User
    admin_user = db.query(User).filter(User.email == "admin@dayflow.com").first()
    if not admin_user:
        admin_user = User(
            email="admin@dayflow.com",
            password_hash=demo_password_hash,
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
        db.flush()

    # 4. HR Users
    hr_users = []
    for i, hr_email in enumerate(["hr1@dayflow.com", "hr2@dayflow.com"], start=1):
        hr_u = db.query(User).filter(User.email == hr_email).first()
        if not hr_u:
            hr_u = User(
                email=hr_email,
                password_hash=demo_password_hash,
                role="HR",
                is_active=True
            )
            db.add(hr_u)
            db.flush()
        hr_users.append(hr_u)

    db.commit()

    # 5. Seed Employees (25 employees)
    first_names = [
        "Aarav", "Ananya", "Rohan", "Priya", "Vikram", "Neha", "Siddharth", "Kavya",
        "Aditya", "Sneha", "Rahul", "Pooja", "Varun", "Isha", "Manish", "Divya",
        "Karan", "Ritu", "Amit", "Meera", "Sanjay", "Swati", "Nikhil", "Simran", "Rajesh"
    ]
    last_names = [
        "Sharma", "Verma", "Mehta", "Patel", "Gupta", "Singh", "Reddy", "Nair",
        "Joshi", "Chopra", "Deshmukh", "Rao", "Bhat", "Saxena", "Kapoor", "Roy",
        "Malhotra", "Kulkarni", "Aggarwal", "Iyer", "Dube", "Pillai", "Choudhury", "Das", "Jain"
    ]
    designations = {
        "Engineering": ["Senior Software Engineer", "Frontend Lead", "Backend Engineer", "DevOps Engineer", "QA Engineer"],
        "HR": ["HR Manager", "Talent Acquisition Specialist", "HR Generalist"],
        "Finance": ["Finance Manager", "Senior Accountant", "Payroll Specialist"],
        "Sales": ["Sales Director", "Account Executive", "Business Development Manager"],
        "Operations": ["Operations Manager", "Facilities Specialist", "IT Support Specialist"]
    }

    dept_names = list(dept_objs.keys())
    employees = []

    for i in range(25):
        emp_code = f"EMP-{i+1:03d}"
        existing_emp = db.query(Employee).filter(Employee.employee_code == emp_code).first()
        if existing_emp:
            employees.append(existing_emp)
            continue

        fn = first_names[i % len(first_names)]
        ln = last_names[i % len(last_names)]
        email = f"{fn.lower()}.{ln.lower()}{i+1}@dayflow.com"
        dept_name = dept_names[i % len(dept_names)]
        dept = dept_objs[dept_name]
        desig = designations[dept_name][i % len(designations[dept_name])]

        role = "MANAGER" if "Manager" in desig or "Lead" in desig or "Director" in desig else "EMPLOYEE"

        u = User(
            email=email,
            password_hash=demo_password_hash,
            role=role,
            is_active=True
        )
        db.add(u)
        db.flush()

        emp = Employee(
            user_id=u.id,
            employee_code=emp_code,
            first_name=fn,
            last_name=ln,
            phone=f"+1-555-01{i+10:02d}",
            address=f"{100 + i*5} Innovation Way, Tech Hub",
            city="San Francisco" if i % 2 == 0 else "New York",
            department_id=dept.id,
            designation=desig,
            joining_date=date(2023, 1 + (i % 12), 1 + (i % 25)),
            employment_status="FULL_TIME",
            profile_picture_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={emp_code}"
        )
        db.add(emp)
        db.flush()
        employees.append(emp)

    db.commit()

    # Assign managers
    eng_manager = employees[0]
    hr_manager = employees[1]
    fin_manager = employees[2]

    for emp in employees:
        if emp.department and emp.department.name == "Engineering" and emp.id != eng_manager.id:
            emp.manager_id = eng_manager.id
        elif emp.department and emp.department.name == "HR" and emp.id != hr_manager.id:
            emp.manager_id = hr_manager.id
        elif emp.department and emp.department.name == "Finance" and emp.id != fin_manager.id:
            emp.manager_id = fin_manager.id

    db.commit()

    # 6. Seed Leave Balances for 2026
    current_year = 2026
    for emp in employees:
        for lt_code, lt_obj in leave_type_objs.items():
            lb = db.query(LeaveBalance).filter(
                LeaveBalance.employee_id == emp.id,
                LeaveBalance.leave_type_id == lt_obj.id,
                LeaveBalance.year == current_year
            ).first()
            if not lb:
                used = float((emp.id * 2 + lt_obj.id) % 5)
                pending = 1.0 if (emp.id % 4 == 0 and lt_code == "PAID") else 0.0
                allocated = float(lt_obj.max_days_per_year)
                lb = LeaveBalance(
                    employee_id=emp.id,
                    leave_type_id=lt_obj.id,
                    allocated_days=allocated,
                    used_days=used,
                    pending_days=pending,
                    remaining_days=max(0.0, allocated - used),
                    year=current_year
                )
                db.add(lb)
    db.commit()

    # 7. Seed Attendance for past 30 days
    today = date.today()
    for day_offset in range(30, -1, -1):
        att_date = today - timedelta(days=day_offset)
        # Skip weekends
        if att_date.weekday() in (5, 6):
            continue

        for idx, emp in enumerate(employees):
            existing_att = db.query(Attendance).filter(
                Attendance.employee_id == emp.id,
                Attendance.date == att_date
            ).first()
            if existing_att:
                continue

            # Deterministic variation
            mod = (idx + att_date.day) % 20
            if mod == 0:
                status = "ABSENT"
                check_in, check_out, hours = None, None, 0.0
            elif mod == 1:
                status = "LEAVE"
                check_in, check_out, hours = None, None, 0.0
            elif mod == 2:
                status = "LATE"
                check_in = datetime.combine(att_date, datetime.strptime("09:45:00", "%H:%M:%S").time(), tzinfo=timezone.utc)
                check_out = datetime.combine(att_date, datetime.strptime("17:30:00", "%H:%M:%S").time(), tzinfo=timezone.utc)
                hours = 7.75
            elif mod == 3:
                status = "HALF_DAY"
                check_in = datetime.combine(att_date, datetime.strptime("09:00:00", "%H:%M:%S").time(), tzinfo=timezone.utc)
                check_out = datetime.combine(att_date, datetime.strptime("13:00:00", "%H:%M:%S").time(), tzinfo=timezone.utc)
                hours = 4.0
            else:
                status = "PRESENT"
                check_in = datetime.combine(att_date, datetime.strptime("08:55:00", "%H:%M:%S").time(), tzinfo=timezone.utc)
                check_out = datetime.combine(att_date, datetime.strptime("17:05:00", "%H:%M:%S").time(), tzinfo=timezone.utc)
                hours = 8.16

            att = Attendance(
                employee_id=emp.id,
                date=att_date,
                check_in=check_in,
                check_out=check_out,
                status=status,
                working_hours=hours,
                source="WEB"
            )
            db.add(att)
    db.commit()

    # 8. Seed Leave Requests
    leave_requests_sample = [
        {"emp_idx": 0, "lt": "PAID", "days": 3, "reason": "Family vacation", "status": "APPROVED"},
        {"emp_idx": 2, "lt": "SICK", "days": 1, "reason": "Flu and doctor visit", "status": "APPROVED"},
        {"emp_idx": 4, "lt": "CASUAL", "days": 2, "reason": "Personal work", "status": "PENDING"},
        {"emp_idx": 6, "lt": "PAID", "days": 5, "reason": "Attending conference", "status": "PENDING"},
        {"emp_idx": 8, "lt": "SICK", "days": 2, "reason": "Dental treatment", "status": "REJECTED"},
    ]

    for req in leave_requests_sample:
        emp = employees[req["emp_idx"]]
        lt = leave_type_objs[req["lt"]]

        start_d = today + timedelta(days=req["emp_idx"] + 2)
        end_d = start_d + timedelta(days=req["days"] - 1)

        lr = LeaveRequest(
            employee_id=emp.id,
            leave_type_id=lt.id,
            start_date=start_d,
            end_date=end_d,
            total_days=float(req["days"]),
            reason=req["reason"],
            status=req["status"],
            reviewed_by=hr_users[0].id if req["status"] != "PENDING" else None,
            reviewer_comment="Approved as per policy" if req["status"] == "APPROVED" else ("Insufficient balance" if req["status"] == "REJECTED" else None)
        )
        db.add(lr)
    db.commit()

    # 9. Seed Payroll Records
    for idx, emp in enumerate(employees):
        existing_pay = db.query(Payroll).filter(Payroll.employee_id == emp.id).first()
        if not existing_pay:
            base_sal = Decimal(60000 + (idx * 3500))
            allow = Decimal(5000 + (idx * 500))
            deduct = Decimal(3000 + (idx * 200))
            net_sal = base_sal + allow - deduct

            pay = Payroll(
                employee_id=emp.id,
                basic_salary=base_sal,
                allowances=allow,
                deductions=deduct,
                net_salary=net_sal,
                effective_from=date(2026, 1, 1),
                currency="USD",
                updated_by=admin_user.id
            )
            db.add(pay)
    db.commit()

    # 10. Seed Notifications
    for emp in employees[:5]:
        n = Notification(
            user_id=emp.user_id,
            title="Welcome to DAYFLOW",
            message="Your employee account has been successfully initialized.",
            type="INFO",
            is_read=False
        )
        db.add(n)
    db.commit()

    # 11. Seed Audit Logs
    audit_events_sample = [
        {"action": "login", "user_id": admin_user.id, "role": "ADMIN", "entity_type": "user", "entity_id": str(admin_user.id)},
        {"action": "check_in", "user_id": employees[0].user_id, "role": "EMPLOYEE", "entity_type": "attendance", "entity_id": "1"},
        {"action": "leave_creation", "user_id": employees[4].user_id, "role": "EMPLOYEE", "entity_type": "leave_request", "entity_id": "3"},
        {"action": "leave_approval", "user_id": hr_users[0].id, "role": "HR", "entity_type": "leave_request", "entity_id": "1"},
        {"action": "AI_RECOMMENDATION", "user_id": admin_user.id, "role": "ADMIN", "entity_type": "ai_insight", "entity_id": "1"},
    ]

    for a_data in audit_events_sample:
        log = AuditLog(**a_data, source="SYSTEM", ip_address="127.0.0.1")
        db.add(log)
    db.commit()

    # 12. Seed AI Events, Insights, Anomalies, Metrics, and Policies
    ai_event = AIEvent(
        request_id="req-ai-1001",
        user_id=admin_user.id,
        agent_name="WorkforceIntelligenceAgent",
        action_type="ANOMALY_DETECTION",
        input_summary="Analyzed last 30 days attendance trends",
        data_sources="attendance,leave_requests",
        decision="Detected 3 late check-in anomalies in Engineering department",
        confidence=0.94,
        guardrail_status="PASSED",
        human_approval_required=False
    )
    db.add(ai_event)

    insight = AIInsight(
        title="Engineering Department Late Rate Surge",
        category="ATTENDANCE",
        description="Late check-ins increased by 14% on Monday mornings for Engineering staff.",
        severity="MEDIUM",
        metrics_json=json.dumps({"department": "Engineering", "late_increase_pct": 14.0})
    )
    db.add(insight)

    anomaly = AttendanceAnomaly(
        employee_id=employees[2].id,
        date=today - timedelta(days=1),
        anomaly_type="FREQ_LATE",
        severity="MEDIUM",
        description="Employee checked in 45 minutes past standard schedule 3 times this week.",
        status="OPEN",
        detected_by="AI_GUARDRAIL"
    )
    db.add(anomaly)

    metric = WorkforceMetric(
        metric_date=today,
        total_employees=len(employees),
        attendance_rate=92.5,
        late_rate=4.2,
        leave_rate=3.3,
        turnover_rate=1.1,
        department_breakdown_json=json.dumps({
            "Engineering": {"total": 5, "present": 4, "rate": 80.0},
            "HR": {"total": 5, "present": 5, "rate": 100.0}
        })
    )
    db.add(metric)

    policy = Policy(
        title="Remote Work & Attendance Policy",
        category="ATTENDANCE",
        content="Employees must log check-in via DAYFLOW web app or mobile app before 09:30 AM local time.",
        version="1.0",
        effective_date=date(2026, 1, 1),
        is_active=True
    )
    db.add(policy)

    db.commit()
    print("[SUCCESS] DAYFLOW Seed script executed successfully!")
