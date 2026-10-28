from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import Supplier, User
from app.schemas.schemas import SupplierCreate, SupplierUpdate, SupplierOut
from app.services.audit import log_audit

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierOut])
def list_suppliers(
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Supplier).filter(Supplier.organization_id == current_user.organization_id)
    if search:
        query = query.filter(
            (Supplier.name.ilike(f"%{search}%")) |
            (Supplier.code.ilike(f"%{search}%")) |
            (Supplier.email.ilike(f"%{search}%"))
        )
    if category and category != "ALL":
        query = query.filter(Supplier.category == category)
    if status and status != "ALL":
        query = query.filter(Supplier.status == status)
    
    return query.order_by(Supplier.name.asc()).all()

@router.post("", response_model=SupplierOut)
def create_supplier(
    req: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Supplier).filter(
        Supplier.organization_id == current_user.organization_id,
        Supplier.code == req.code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Supplier code {req.code} already exists.")

    supplier = Supplier(
        organization_id=current_user.organization_id,
        **req.dict()
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    log_audit(
        db, current_user.organization_id, "CREATE", "Supplier",
        supplier.id, current_user.id, current_user.full_name,
        f"Created supplier {supplier.code} - {supplier.name}"
    )
    db.commit()
    return supplier

@router.get("/{id}", response_model=SupplierOut)
def get_supplier(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = db.query(Supplier).filter(
        Supplier.id == id,
        Supplier.organization_id == current_user.organization_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.patch("/{id}", response_model=SupplierOut)
def update_supplier(
    id: str,
    req: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = db.query(Supplier).filter(
        Supplier.id == id,
        Supplier.organization_id == current_user.organization_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = req.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(supplier, key, val)

    log_audit(
        db, current_user.organization_id, "UPDATE", "Supplier",
        supplier.id, current_user.id, current_user.full_name,
        f"Updated supplier {supplier.code} fields: {', '.join(update_data.keys())}"
    )
    db.commit()
    db.refresh(supplier)
    return supplier
