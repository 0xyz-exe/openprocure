from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Budget, User

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=List[dict])
def list_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budgets = db.query(Budget).filter(
        Budget.organization_id == current_user.organization_id
    ).order_by(Budget.department.asc()).all()
    
    results = []
    for b in budgets:
        utilization = round((b.actual_spent / b.allocated_amount * 100), 1) if b.allocated_amount > 0 else 0.0
        remaining = round(b.allocated_amount - (b.actual_spent + b.committed_amount), 2)
        results.append({
            "id": b.id,
            "department": b.department,
            "fiscal_year": b.fiscal_year,
            "allocated_amount": b.allocated_amount,
            "committed_amount": b.committed_amount,
            "actual_spent": b.actual_spent,
            "remaining_amount": remaining,
            "utilization_percent": utilization,
            "currency": b.currency
        })
    return results
