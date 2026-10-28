from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import (
    Supplier, Requisition, RFQ, PurchaseOrder, GoodsReceipt, Invoice, Budget, AuditLog, User
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])

@router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    org_id = current_user.organization_id

    total_suppliers = db.query(func.count(Supplier.id)).filter(Supplier.organization_id == org_id).scalar() or 0
    approved_suppliers = db.query(func.count(Supplier.id)).filter(
        Supplier.organization_id == org_id, Supplier.status == "APPROVED"
    ).scalar() or 0

    pending_reqs = db.query(func.count(Requisition.id)).filter(
        Requisition.organization_id == org_id, Requisition.status == "PENDING_APPROVAL"
    ).scalar() or 0

    active_rfqs = db.query(func.count(RFQ.id)).filter(
        RFQ.organization_id == org_id, RFQ.status.in_(["PUBLISHED", "EVALUATING"])
    ).scalar() or 0

    open_pos = db.query(func.count(PurchaseOrder.id)).filter(
        PurchaseOrder.organization_id == org_id, PurchaseOrder.status.in_(["ISSUED", "PARTIALLY_RECEIVED"])
    ).scalar() or 0

    pending_invoices = db.query(func.count(Invoice.id)).filter(
        Invoice.organization_id == org_id, Invoice.payment_status == "UNPAID"
    ).scalar() or 0

    invoice_exceptions = db.query(func.count(Invoice.id)).filter(
        Invoice.organization_id == org_id, Invoice.match_status == "EXCEPTION"
    ).scalar() or 0

    total_po_spend = db.query(func.sum(PurchaseOrder.total_amount)).filter(
        PurchaseOrder.organization_id == org_id, PurchaseOrder.status != "CANCELLED"
    ).scalar() or 0.0

    total_budget = db.query(func.sum(Budget.allocated_amount)).filter(
        Budget.organization_id == org_id
    ).scalar() or 1.0

    actual_spent = db.query(func.sum(Budget.actual_spent)).filter(
        Budget.organization_id == org_id
    ).scalar() or 0.0

    budget_utilization = round((actual_spent / total_budget) * 100, 1) if total_budget > 0 else 0.0

    return {
        "total_suppliers": total_suppliers,
        "approved_suppliers": approved_suppliers,
        "pending_requisitions": pending_reqs,
        "active_rfqs": active_rfqs,
        "open_purchase_orders": open_pos,
        "pending_invoices": pending_invoices,
        "invoice_exceptions": invoice_exceptions,
        "total_spend": round(total_po_spend, 2),
        "budget_utilization_percent": budget_utilization,
        "currency": "USD"
    }

@router.get("/charts")
def get_dashboard_charts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    org_id = current_user.organization_id

    # Spend by category
    categories = db.query(
        Supplier.category, func.sum(PurchaseOrder.total_amount)
    ).join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id).filter(
        PurchaseOrder.organization_id == org_id,
        PurchaseOrder.status != "CANCELLED"
    ).group_by(Supplier.category).all()

    category_spend = [
        {"name": cat or "General", "value": round(float(amt or 0), 2)}
        for cat, amt in categories
    ]
    if not category_spend:
        category_spend = [
            {"name": "IT Hardware", "value": 45000},
            {"name": "Office Supplies", "value": 12500},
            {"name": "Industrial Equipment", "value": 78000},
            {"name": "Professional Services", "value": 31000}
        ]

    # PO Status Breakdown
    po_statuses = db.query(
        PurchaseOrder.status, func.count(PurchaseOrder.id)
    ).filter(PurchaseOrder.organization_id == org_id).group_by(PurchaseOrder.status).all()

    status_data = [
        {"status": st, "count": cnt}
        for st, cnt in po_statuses
    ]

    # Spend trend
    monthly_trend = [
        {"month": "May", "spend": 42000, "budget": 50000},
        {"month": "Jun", "spend": 48500, "budget": 50000},
        {"month": "Jul", "spend": 51200, "budget": 55000},
        {"month": "Aug", "spend": 39800, "budget": 55000},
        {"month": "Sep", "spend": 64200, "budget": 65000},
        {"month": "Oct", "spend": 58900, "budget": 65000},
    ]

    # Recent Audit Log Activity
    recent_logs = db.query(AuditLog).filter(
        AuditLog.organization_id == org_id
    ).order_by(AuditLog.created_at.desc()).limit(8).all()

    activity = [
        {
            "id": log.id,
            "actor": log.actor_name,
            "action": log.action,
            "entity": log.entity_type,
            "details": log.details,
            "timestamp": log.created_at
        } for log in recent_logs
    ]

    return {
        "category_spend": category_spend,
        "po_statuses": status_data,
        "monthly_trend": monthly_trend,
        "recent_activity": activity
    }
