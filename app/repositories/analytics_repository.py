from typing import Dict, Any, List, Optional
from datetime import date, timedelta
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.department import Department
from app.models.attendance import Attendance
from app.models.leave import LeaveRequest


class AnalyticsRepository:
    @staticmethod
    def get_total_employees(db: Session) -> int:
        return db.query(func.count(Employee.id)).filter(
            Employee.employment_status != "TERMINATED"
        ).scalar() or 0

    @staticmethod
    def get_present_employees(db: Session, target_date: date) -> int:
        return db.query(func.count(Attendance.id)).filter(
            Attendance.date == target_date,
            Attendance.status.in_(["PRESENT", "LATE", "HALF_DAY"])
        ).scalar() or 0

    @staticmethod
    def get_absent_employees(db: Session, target_date: date) -> int:
        return db.query(func.count(Attendance.id)).filter(
            Attendance.date == target_date,
            Attendance.status == "ABSENT"
        ).scalar() or 0

    @staticmethod
    def get_employees_on_leave(db: Session, target_date: date) -> int:
        # Check attendance table as well as approved leave requests active on date
        leave_att_count = db.query(func.count(Attendance.id)).filter(
            Attendance.date == target_date,
            Attendance.status == "LEAVE"
        ).scalar() or 0

        req_count = db.query(func.count(LeaveRequest.id)).filter(
            LeaveRequest.status == "APPROVED",
            LeaveRequest.start_date <= target_date,
            LeaveRequest.end_date >= target_date
        ).scalar() or 0

        return max(leave_att_count, req_count)

    @staticmethod
    def get_late_employees(db: Session, target_date: date) -> int:
        return db.query(func.count(Attendance.id)).filter(
            Attendance.date == target_date,
            Attendance.status == "LATE"
        ).scalar() or 0

    @staticmethod
    def get_attendance_rate(db: Session, target_date: date) -> float:
        total = AnalyticsRepository.get_total_employees(db)
        if total == 0:
            return 0.0
        present = AnalyticsRepository.get_present_employees(db, target_date)
        return round((present / total) * 100.0, 2)

    @staticmethod
    def get_pending_leaves_count(db: Session) -> int:
        return db.query(func.count(LeaveRequest.id)).filter(
            LeaveRequest.status == "PENDING"
        ).scalar() or 0

    @staticmethod
    def get_department_attendance(db: Session, target_date: date) -> List[Dict[str, Any]]:
        departments = db.query(Department).all()
        results = []

        for dept in departments:
            total_dept_emp = db.query(func.count(Employee.id)).filter(
                Employee.department_id == dept.id,
                Employee.employment_status != "TERMINATED"
            ).scalar() or 0

            if total_dept_emp == 0:
                continue

            # Query attendance records joined with employees
            att_counts = db.query(
                Attendance.status,
                func.count(Attendance.id)
            ).join(Employee, Attendance.employee_id == Employee.id).filter(
                Employee.department_id == dept.id,
                Attendance.date == target_date
            ).group_by(Attendance.status).all()

            status_map = {st: count for st, count in att_counts}
            present_cnt = status_map.get("PRESENT", 0) + status_map.get("LATE", 0) + status_map.get("HALF_DAY", 0)
            absent_cnt = status_map.get("ABSENT", 0)
            late_cnt = status_map.get("LATE", 0)

            att_rate = round((present_cnt / total_dept_emp) * 100.0, 2) if total_dept_emp > 0 else 0.0
            late_rate = round((late_cnt / total_dept_emp) * 100.0, 2) if total_dept_emp > 0 else 0.0

            results.append({
                "department_id": dept.id,
                "department_name": dept.name,
                "total_employees": total_dept_emp,
                "present_employees": present_cnt,
                "absent_employees": absent_cnt,
                "late_employees": late_cnt,
                "attendance_rate": att_rate,
                "late_rate": late_rate
            })

        return results

    @staticmethod
    def get_attendance_trends(db: Session, days: int = 14) -> List[Dict[str, Any]]:
        today = date.today()
        start_date = today - timedelta(days=days - 1)
        total_emp = AnalyticsRepository.get_total_employees(db)

        trend_data = []
        for i in range(days):
            curr_date = start_date + timedelta(days=i)
            records = db.query(
                Attendance.status,
                func.count(Attendance.id)
            ).filter(Attendance.date == curr_date).group_by(Attendance.status).all()

            map_st = {st: count for st, count in records}
            present = map_st.get("PRESENT", 0)
            late = map_st.get("LATE", 0)
            half = map_st.get("HALF_DAY", 0)
            absent = map_st.get("ABSENT", 0)
            leave = map_st.get("LEAVE", 0)

            present_total = present + late + half
            att_rate = round((present_total / total_emp) * 100.0, 2) if total_emp > 0 else 0.0

            trend_data.append({
                "date": curr_date.isoformat(),
                "total": total_emp,
                "present": present_total,
                "absent": absent,
                "late": late,
                "leave": leave,
                "attendance_rate": att_rate
            })

        return trend_data

    @staticmethod
    def get_leave_trends(db: Session) -> List[Dict[str, Any]]:
        # Group leave requests by month
        records = db.query(
            func.strftime("%Y-%m", LeaveRequest.created_at).label("month"),
            LeaveRequest.status,
            func.count(LeaveRequest.id)
        ).group_by("month", LeaveRequest.status).all()

        month_map: Dict[str, Dict[str, int]] = {}
        for row in records:
            m, st, cnt = row[0], row[1], row[2]
            if not m:
                continue
            if m not in month_map:
                month_map[m] = {"total_requested": 0, "APPROVED": 0, "PENDING": 0, "REJECTED": 0}
            month_map[m]["total_requested"] += cnt
            if st in month_map[m]:
                month_map[m][st] += cnt

        result = []
        for m in sorted(month_map.keys()):
            item = month_map[m]
            result.append({
                "month": m,
                "total_requested": item["total_requested"],
                "approved": item["APPROVED"],
                "pending": item["PENDING"],
                "rejected": item["REJECTED"]
            })
        return result

    @staticmethod
    def get_workforce_health(db: Session, target_date: date) -> str:
        att_rate = AnalyticsRepository.get_attendance_rate(db, target_date)
        late_cnt = AnalyticsRepository.get_late_employees(db, target_date)
        total_emp = AnalyticsRepository.get_total_employees(db)
        late_rate = (late_cnt / total_emp) * 100.0 if total_emp > 0 else 0.0

        if att_rate >= 90.0 and late_rate <= 5.0:
            return "EXCELLENT"
        elif att_rate >= 80.0 and late_rate <= 15.0:
            return "GOOD"
        elif att_rate >= 70.0:
            return "ATTENTION_REQUIRED"
        else:
            return "CRITICAL"

    @staticmethod
    def get_full_dashboard_summary(db: Session, target_date: Optional[date] = None) -> Dict[str, Any]:
        if not target_date:
            target_date = date.today()

        total = AnalyticsRepository.get_total_employees(db)
        present = AnalyticsRepository.get_present_employees(db, target_date)
        absent = AnalyticsRepository.get_absent_employees(db, target_date)
        on_leave = AnalyticsRepository.get_employees_on_leave(db, target_date)
        late = AnalyticsRepository.get_late_employees(db, target_date)
        att_rate = AnalyticsRepository.get_attendance_rate(db, target_date)
        pending_leaves = AnalyticsRepository.get_pending_leaves_count(db)
        health = AnalyticsRepository.get_workforce_health(db, target_date)
        dept_att = AnalyticsRepository.get_department_attendance(db, target_date)
        att_trends = AnalyticsRepository.get_attendance_trends(db, days=14)
        leave_trends = AnalyticsRepository.get_leave_trends(db)

        return {
            "total_employees": total,
            "present_employees": present,
            "absent_employees": absent,
            "employees_on_leave": on_leave,
            "late_employees": late,
            "attendance_rate": att_rate,
            "pending_leaves": pending_leaves,
            "workforce_health": health,
            "department_attendance": dept_att,
            "attendance_trends": att_trends,
            "leave_trends": leave_trends,
        }
