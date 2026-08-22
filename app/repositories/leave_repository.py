from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models.leave import LeaveType, LeaveRequest, LeaveBalance


class LeaveRepository:
    @staticmethod
    def get_leave_types(db: Session) -> List[LeaveType]:
        return db.query(LeaveType).all()

    @staticmethod
    def get_leave_type_by_code(db: Session, code: str) -> Optional[LeaveType]:
        return db.query(LeaveType).filter(LeaveType.code == code).first()

    @staticmethod
    def create_leave_type(db: Session, **kwargs) -> LeaveType:
        leave_type = LeaveType(**kwargs)
        db.add(leave_type)
        db.commit()
        db.refresh(leave_type)
        return leave_type

    @staticmethod
    def create_leave_request(db: Session, **kwargs) -> LeaveRequest:
        request = LeaveRequest(**kwargs)
        db.add(request)

        # Update pending balance if balance record exists
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == request.employee_id,
            LeaveBalance.leave_type_id == request.leave_type_id,
            LeaveBalance.year == request.start_date.year
        ).first()
        if balance:
            balance.pending_days += request.total_days

        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def get_leave_request(db: Session, request_id: int) -> Optional[LeaveRequest]:
        return db.query(LeaveRequest).options(
            joinedload(LeaveRequest.employee),
            joinedload(LeaveRequest.leave_type)
        ).filter(LeaveRequest.id == request_id).first()

    @staticmethod
    def update_request_status(
        db: Session,
        request_id: int,
        status: str,
        reviewed_by: Optional[int] = None,
        reviewer_comment: Optional[str] = None
    ) -> Optional[LeaveRequest]:
        request = LeaveRepository.get_leave_request(db, request_id)
        if not request:
            return None

        old_status = request.status
        request.status = status
        if reviewed_by:
            request.reviewed_by = reviewed_by
        if reviewer_comment:
            request.reviewer_comment = reviewer_comment

        # Sync leave balance
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == request.employee_id,
            LeaveBalance.leave_type_id == request.leave_type_id,
            LeaveBalance.year == request.start_date.year
        ).first()

        if balance and old_status == "PENDING":
            balance.pending_days = max(0.0, balance.pending_days - request.total_days)
            if status == "APPROVED":
                balance.used_days += request.total_days
                balance.remaining_days = max(0.0, balance.allocated_days - balance.used_days)

        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def list_requests(
        db: Session,
        employee_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[LeaveRequest]:
        query = db.query(LeaveRequest).options(
            joinedload(LeaveRequest.employee),
            joinedload(LeaveRequest.leave_type)
        )
        if employee_id:
            query = query.filter(LeaveRequest.employee_id == employee_id)
        if status:
            query = query.filter(LeaveRequest.status == status)
        return query.order_by(LeaveRequest.created_at.desc()).all()

    @staticmethod
    def get_balances(db: Session, employee_id: int, year: int) -> List[LeaveBalance]:
        return db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.year == year
        ).all()

    @staticmethod
    def initialize_balances_for_employee(db: Session, employee_id: int, year: int):
        leave_types = LeaveRepository.get_leave_types(db)
        for lt in leave_types:
            existing = db.query(LeaveBalance).filter(
                LeaveBalance.employee_id == employee_id,
                LeaveBalance.leave_type_id == lt.id,
                LeaveBalance.year == year
            ).first()
            if not existing:
                lb = LeaveBalance(
                    employee_id=employee_id,
                    leave_type_id=lt.id,
                    allocated_days=float(lt.max_days_per_year),
                    used_days=0.0,
                    pending_days=0.0,
                    remaining_days=float(lt.max_days_per_year),
                    year=year
                )
                db.add(lb)
        db.commit()
