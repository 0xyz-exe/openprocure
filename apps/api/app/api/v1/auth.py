from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import User, Organization
from app.schemas.schemas import LoginRequest, RegisterRequest, Token, UserOut
from app.core.deps import get_current_user
from app.services.audit import log_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Check or create organization
    org = db.query(Organization).first()
    if not org:
        org_code = req.organization_name.lower().replace(" ", "-")[:12]
        org = Organization(
            name=req.organization_name,
            code=org_code,
            currency="USD",
            timezone="UTC"
        )
        db.add(org)
        db.flush()

    user = User(
        organization_id=org.id,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role=req.role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(db, org.id, "REGISTER", "User", user.id, user.id, user.full_name, f"User registered: {user.email}")
    db.commit()

    token = create_access_token({"sub": user.id, "org": org.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": org.id,
            "organization_name": org.name
        }
    }

@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email credentials or password.",
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")

    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    token = create_access_token({"sub": user.id, "org": user.organization_id, "role": user.role})
    
    log_audit(db, user.organization_id, "LOGIN", "User", user.id, user.id, user.full_name, "Successful login")
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": user.organization_id,
            "organization_name": org.name if org else "Default Org"
        }
    }

@router.get("/me", response_model=dict)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "organization_id": current_user.organization_id,
        "organization_name": org.name if org else "Default Org",
        "currency": org.currency if org else "USD"
    }
