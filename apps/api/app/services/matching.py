from typing import Tuple, List
from sqlalchemy.orm import Session
from app.models.models import PurchaseOrder, Invoice, GoodsReceipt

def perform_three_way_match(db: Session, invoice: Invoice) -> Tuple[str, str]:
    """
    Executes 3-way matching:
    1. PO Verification
    2. Goods Receipt Quantity Verification
    3. Price / Tolerance Verification
    Returns (match_status, exception_reason)
    """
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == invoice.purchase_order_id).first()
    if not po:
        return ("EXCEPTION", "Referenced Purchase Order not found.")

    if po.supplier_id != invoice.supplier_id:
        return ("EXCEPTION", f"Supplier mismatch: Invoice supplier does not match PO vendor {po.supplier.name}.")

    # Check PO status
    if po.status in ["CANCELLED", "DRAFT"]:
        return ("EXCEPTION", f"Purchase Order is in invalid state: {po.status}")

    # Map PO items
    po_items_map = {item.id: item for item in po.items}
    exceptions: List[str] = []

    for inv_item in invoice.items:
        if not inv_item.po_item_id or inv_item.po_item_id not in po_items_map:
            # Line item not matched to PO
            exceptions.append(f"Line '{inv_item.description}' does not map to a recognized PO item.")
            continue

        po_item = po_items_map[inv_item.po_item_id]

        # 1. Price check (tolerance 1%)
        price_diff = abs(inv_item.unit_price - po_item.unit_price)
        max_allowed_diff = po_item.unit_price * 0.01 + 0.01
        if price_diff > max_allowed_diff:
            exceptions.append(
                f"Price discrepancy on '{po_item.description}': Invoiced ${inv_item.unit_price:.2f} vs PO ${po_item.unit_price:.2f}."
            )

        # 2. Quantity check against received quantities
        if inv_item.quantity > po_item.received_quantity:
            exceptions.append(
                f"Quantity discrepancy on '{po_item.description}': Invoiced {inv_item.quantity} exceeds Goods Received {po_item.received_quantity}."
            )

        # 3. Quantity check against ordered
        if inv_item.quantity > po_item.quantity:
            exceptions.append(
                f"Over-billing on '{po_item.description}': Invoiced {inv_item.quantity} exceeds PO ordered {po_item.quantity}."
            )

    if exceptions:
        return ("EXCEPTION", " | ".join(exceptions))
    
    return ("MATCHED", "Three-way match verified against Purchase Order and Goods Receipts.")
