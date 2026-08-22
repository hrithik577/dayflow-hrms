import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.auth import UserLogin, UserRegister, GoogleAuthRequest, TokenResponse, UserOut
from app.models.user import User, UserRole
from app.models.employee import Employee, EmploymentStatus
from app.models.department import Department
from app.services.auth_service import get_current_user
from app.services.audit_service import log_audit_event
from datetime import date

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/google", response_model=TokenResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        response = httpx.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": req.token}, timeout=10.0)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google OAuth token")
        
        payload = response.json()
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Google token does not contain a valid email address")

        email = email.lower()
        first_name = payload.get("given_name", "Google")
        last_name = payload.get("family_name", "User")
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Failed to verify Google token: {str(e)}")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        emp_id_code = f"EMP-{db.query(User).count() + 101:04d}"
        new_user = User(
            employee_id=emp_id_code,
            email=email,
            password_hash=get_password_hash("GoogleAuth@2026!Secured"),
            role=UserRole.EMPLOYEE,
            email_verified=True,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        employee = Employee(
            user_id=new_user.id,
            employee_code=emp_id_code,
            first_name=first_name,
            last_name=last_name,
            designation="Team Member",
            joining_date=date.today(),
            employment_status=EmploymentStatus.ACTIVE
        )
        db.add(employee)
        db.commit()

        log_audit_event(
            db=db,
            user_id=new_user.id,
            role=new_user.role.value,
            action="USER_SIGNUP_GOOGLE",
            entity_type="USER",
            entity_id=str(new_user.id),
            new_value="Registered via Google OAuth"
        )
        user = new_user

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    token = create_access_token(subject=user.id, role=user.role.value)

    log_audit_event(
        db=db,
        user_id=user.id,
        role=user.role.value,
        action="USER_LOGIN_GOOGLE",
        entity_type="USER",
        entity_id=str(user.id),
        new_value="Successful Google login"
    )

    emp_details = None
    if user.employee:
        emp_details = {
            "id": user.employee.id,
            "first_name": user.employee.first_name,
            "last_name": user.employee.last_name,
            "designation": user.employee.designation,
            "department_id": user.employee.department_id,
            "department_name": user.employee.department.name if user.employee.department else "General"
        }

    user_out = UserOut(
        id=user.id,
        employee_id=user.employee_id,
        email=user.email,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
        email_verified=user.email_verified,
        is_active=user.is_active,
        employee_details=emp_details
    )

    return TokenResponse(access_token=token, user=user_out)

@router.post("/signup", response_model=TokenResponse)
def signup(req: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    emp_id_code = req.employee_code or f"EMP-{db.query(User).count() + 101:04d}"
    
    role_enum = UserRole.EMPLOYEE
    if req.role.upper() == "HR":
        role_enum = UserRole.HR
    elif req.role.upper() == "ADMIN":
        role_enum = UserRole.ADMIN

    new_user = User(
        employee_id=emp_id_code,
        email=req.email.lower(),
        password_hash=get_password_hash(req.password),
        role=role_enum,
        email_verified=True,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create associated Employee profile
    employee = Employee(
        user_id=new_user.id,
        employee_code=emp_id_code,
        first_name=req.first_name,
        last_name=req.last_name,
        department_id=req.department_id,
        designation=req.designation or "Team Member",
        joining_date=date.today(),
        employment_status=EmploymentStatus.ACTIVE
    )
    db.add(employee)
    db.commit()

    log_audit_event(
        db=db,
        user_id=new_user.id,
        role=new_user.role.value,
        action="USER_SIGNUP",
        entity_type="USER",
        entity_id=str(new_user.id),
        new_value=f"Registered as {new_user.role.value}"
    )

    token = create_access_token(subject=new_user.id, role=new_user.role.value)
    
    user_out = UserOut(
        id=new_user.id,
        employee_id=new_user.employee_id,
        email=new_user.email,
        role=new_user.role.value,
        email_verified=new_user.email_verified,
        is_active=new_user.is_active,
        employee_details={
            "id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "designation": employee.designation
        }
    )

    return TokenResponse(access_token=token, user=user_out)

@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    token = create_access_token(subject=user.id, role=user.role.value)

    log_audit_event(
        db=db,
        user_id=user.id,
        role=user.role.value,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        new_value="Successful login"
    )

    emp_details = None
    if user.employee:
        emp_details = {
            "id": user.employee.id,
            "first_name": user.employee.first_name,
            "last_name": user.employee.last_name,
            "designation": user.employee.designation,
            "department_id": user.employee.department_id,
            "department_name": user.employee.department.name if user.employee.department else "General"
        }

    user_out = UserOut(
        id=user.id,
        employee_id=user.employee_id,
        email=user.email,
        role=user.role.value,
        email_verified=user.email_verified,
        is_active=user.is_active,
        employee_details=emp_details
    )

    return TokenResponse(access_token=token, user=user_out)

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit_event(
        db=db,
        user_id=current_user.id,
        role=current_user.role.value,
        action="USER_LOGOUT",
        entity_type="USER",
        entity_id=str(current_user.id)
    )
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    emp_details = None
    if current_user.employee:
        emp_details = {
            "id": current_user.employee.id,
            "employee_code": current_user.employee.employee_code,
            "first_name": current_user.employee.first_name,
            "last_name": current_user.employee.last_name,
            "phone": current_user.employee.phone,
            "address": current_user.employee.address,
            "city": current_user.employee.city,
            "designation": current_user.employee.designation,
            "department_id": current_user.employee.department_id,
            "department_name": current_user.employee.department.name if current_user.employee.department else "General",
            "joining_date": str(current_user.employee.joining_date),
            "employment_status": current_user.employee.employment_status.value if hasattr(current_user.employee.employment_status, 'value') else str(current_user.employee.employment_status)
        }

    return UserOut(
        id=current_user.id,
        employee_id=current_user.employee_id,
        email=current_user.email,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        email_verified=current_user.email_verified,
        is_active=current_user.is_active,
        employee_details=emp_details
    )
