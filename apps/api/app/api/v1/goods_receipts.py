from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import GoodsReceipt, GoodsReceiptItem, PurchaseOrder, PurchaseOrderItem, User
from app.schemas.schemas import GoodsReceiptCreate
from app.services.numbering import next_receipt_number
from app.services.audit import log_audit, create_notification

router = APIRouter(prefix="/goods-receipts", tags=["Goods Receipts"])

@router.get("", response_model=List[dict])
def list_goods_receipts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    receipts = db.query(GoodsReceipt).filter(
        GoodsReceipt.organization_id == current_user.organization_id
    ).order_by(GoodsReceipt.created_at.desc()).all()
    
    results = []
    for gr in receipts:
        results.append({
            "id": gr.id,
            "receipt_number": gr.receipt_number,
            "po_id": gr.purchase_order_id,
            "po_number": gr.purchase_order.po_number if gr.purchase_order else "N/A",
            "supplier_name": gr.supplier_name,
            "received_by": gr.received_by,
            "receipt_date": gr.receipt_date,
            "receiving_location": gr.receiving_location,
            "status": gr.status,
            "items_count": len(gr.items)
        })
    return results

@router.post("", response_model=dict)
def create_goods_receipt(
    req: GoodsReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == req.purchase_order_id,
        PurchaseOrder.organization_id == current_user.organization_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    if po.status in ["CANCELLED", "CLOSED"]:
        raise HTTPException(status_code=400, detail=f"Cannot receive goods for {po.status} purchase order.")

    po_items_map = {item.id: item for item in po.items}
    receipt_items_to_add = []
    discrepancy_detected = False

    for item in req.items:
        if item.po_item_id not in po_items_map:
            raise HTTPException(status_code=400, detail=f"Line item {item.po_item_id} does not belong to PO {po.po_number}")

        po_item = po_items_map[item.po_item_id]
        remaining = po_item.quantity - po_item.received_quantity
        
        # Over-receipt validation
        if item.quantity_received > remaining:
            raise HTTPException(
                status_code=400,
                detail=f"Over-receipt rejected: Received {item.quantity_received} exceeds outstanding order quantity {remaining} for '{po_item.description}'."
            )

        if item.quantity_rejected > 0:
            discrepancy_detected = True

        # Atomically update received quantity on PO line item
        po_item.received_quantity += item.quantity_accepted

        receipt_items_to_add.append(
            GoodsReceiptItem(
                po_item_id=po_item.id,
                description=item.description,
                quantity_received=item.quantity_received,
                quantity_accepted=item.quantity_accepted,
                quantity_rejected=item.quantity_rejected,
                rejection_reason=item.rejection_reason
            )
        )

    # Determine PO fulfillment status
    all_fulfilled = all(it.received_quantity >= it.quantity for it in po.items)
    some_fulfilled = any(it.received_quantity > 0 for it in po.items)

    if all_fulfilled:
        po.status = "FULLY_RECEIVED"
    elif some_fulfilled:
        po.status = "PARTIALLY_RECEIVED"

    rec_status = "DISCREPANCY" if discrepancy_detected else ("PARTIAL" if not all_fulfilled else "ACCEPTED")

    gr_number = next_receipt_number(db)
    gr = GoodsReceipt(
        organization_id=current_user.organization_id,
        receipt_number=gr_number,
        purchase_order_id=po.id,
        supplier_name=po.supplier.name if po.supplier else "Vendor",
        received_by=current_user.full_name,
        receiving_location=req.receiving_location,
        notes=req.notes,
        status=rec_status,
        items=receipt_items_to_add
    )
    db.add(gr)
    db.commit()
    db.refresh(gr)

    log_audit(
        db, current_user.organization_id, "GOODS_RECEIPT", "GoodsReceipt",
        gr.id, current_user.id, current_user.full_name,
        f"Processed Goods Receipt {gr.receipt_number} for PO {po.po_number} (Status: {rec_status})"
    )
    create_notification(
        db, current_user.organization_id,
        "Goods Received",
        f"Goods receipt {gr.receipt_number} recorded for PO {po.po_number}.",
        link=f"/goods-receipts"
    )
    db.commit()

    return {
        "id": gr.id,
        "receipt_number": gr.receipt_number,
        "status": gr.status,
        "po_status": po.status
    }
