from datetime import datetime, timezone
import random
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Requisition, PurchaseOrder, RFQ, GoodsReceipt, Invoice

def generate_doc_number(prefix: str, db: Session, model, col) -> str:
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y%m")
    # Count existing in this month
    count = db.query(func.count(col)).filter(col.like(f"{prefix}-{date_str}-%")).scalar() or 0
    seq = count + 1
    # Check collisions
    number = f"{prefix}-{date_str}-{seq:04d}"
    exists = db.query(col).filter(col == number).first()
    if exists:
        suffix = random.randint(1000, 9999)
        number = f"{prefix}-{date_str}-{seq:04d}-{suffix}"
    return number

def next_requisition_number(db: Session) -> str:
    return generate_doc_number("REQ", db, Requisition, Requisition.requisition_number)

def next_po_number(db: Session) -> str:
    return generate_doc_number("PO", db, PurchaseOrder, PurchaseOrder.po_number)

def next_rfq_number(db: Session) -> str:
    return generate_doc_number("RFQ", db, RFQ, RFQ.rfq_number)

def next_receipt_number(db: Session) -> str:
    return generate_doc_number("REC", db, GoodsReceipt, GoodsReceipt.receipt_number)

def next_invoice_number(db: Session) -> str:
    return generate_doc_number("INV", db, Invoice, Invoice.invoice_number)
