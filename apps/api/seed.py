import sys
import os
from datetime import datetime, timezone, timedelta

# Add current path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import (
    Organization, User, Supplier, Budget, Requisition, RequisitionItem,
    RFQ, Quotation, QuotationItem, PurchaseOrder, PurchaseOrderItem,
    GoodsReceipt, GoodsReceiptItem, Invoice, InvoiceItem, AuditLog, Notification
)

def run_seed():
    print("🌱 Running OpenProcure deterministic database seed...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Organization
        org = db.query(Organization).filter(Organization.code == "apex-global").first()
        if not org:
            org = Organization(
                name="Apex Global Technologies",
                code="apex-global",
                currency="USD",
                timezone="America/New_York"
            )
            db.add(org)
            db.flush()
            print("✓ Created Organization: Apex Global Technologies")

        # 2. Users
        users_data = [
            ("admin@openprocure.org", "Sarah Connor", "ADMIN", "AdminPass123!"),
            ("procurement@openprocure.org", "Marcus Vance", "PROCUREMENT_MANAGER", "ProcurePass123!"),
            ("finance@openprocure.org", "Elena Rostova", "FINANCE", "FinancePass123!"),
            ("requester@openprocure.org", "David Chen", "REQUESTER", "RequestPass123!"),
            ("warehouse@openprocure.org", "Tom Hardy", "WAREHOUSE", "WarehousePass123!"),
        ]

        user_map = {}
        for email, name, role, pwd in users_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    organization_id=org.id,
                    email=email,
                    full_name=name,
                    role=role,
                    hashed_password=get_password_hash(pwd),
                    is_active=True
                )
                db.add(u)
                db.flush()
                print(f"✓ Created User: {email} ({role})")
            user_map[role] = u

        # 3. Budgets
        budgets_data = [
            ("IT Infrastructure", 250000.0, 52000.0, 89400.0),
            ("Operations", 180000.0, 31000.0, 64200.0),
            ("Engineering", 320000.0, 84000.0, 142000.0),
            ("Facilities", 95000.0, 15000.0, 38500.0),
        ]
        for dept, alloc, comm, spent in budgets_data:
            b = db.query(Budget).filter(Budget.organization_id == org.id, Budget.department == dept).first()
            if not b:
                b = Budget(
                    organization_id=org.id,
                    department=dept,
                    fiscal_year=2026,
                    allocated_amount=alloc,
                    committed_amount=comm,
                    actual_spent=spent,
                    currency="USD"
                )
                db.add(b)
                print(f"✓ Created Budget for {dept}: ${alloc:,.2f}")

        # 4. Suppliers
        suppliers_data = [
            ("SUP-101", "Nexus Cloud Networks", "Nexus Tech Corp", "IT Hardware & Cloud", "alice@nexuscloud.io", "+1-555-0192", "452 Silicon Ave, San Jose, CA", "Net 30", 4.9),
            ("SUP-102", "Starlight Industrial Supplies", "Starlight Heavy Ind Ltd", "Machinery & Facilities", "sales@starlight-ind.com", "+1-555-0843", "1200 Industrial Pkwy, Chicago, IL", "Net 45", 4.7),
            ("SUP-103", "Vanguard Office Logistics", "Vanguard Holdings Inc", "General Goods", "contact@vanguardoffice.com", "+1-555-0329", "88 Market St, Boston, MA", "Net 30", 4.5),
            ("SUP-104", "Quantum Microchips Ltd", "Quantum Silicon Global", "Semiconductors", "orders@quantumchip.com", "+1-555-0761", "101 Micro Way, Austin, TX", "Net 30", 4.8),
            ("SUP-105", "Apex Logistics & Freight", "Apex Global Freight LLC", "Logistics & Shipping", "freight@apexlogistics.com", "+1-555-0554", "770 Harbor Blvd, Seattle, WA", "Net 15", 4.6),
        ]

        supplier_map = {}
        for code, name, legal, cat, email, phone, addr, terms, rating in suppliers_data:
            s = db.query(Supplier).filter(Supplier.organization_id == org.id, Supplier.code == code).first()
            if not s:
                s = Supplier(
                    organization_id=org.id,
                    code=code,
                    name=name,
                    legal_name=legal,
                    category=cat,
                    email=email,
                    phone=phone,
                    address=addr,
                    payment_terms=terms,
                    rating=rating,
                    status="APPROVED"
                )
                db.add(s)
                db.flush()
                print(f"✓ Created Supplier: {code} - {name}")
            supplier_map[code] = s

        # 5. Requisition (Approved & Converted)
        req1 = db.query(Requisition).filter(Requisition.requisition_number == "REQ-202610-0001").first()
        if not req1:
            req1 = Requisition(
                organization_id=org.id,
                requisition_number="REQ-202610-0001",
                requester_id=user_map["REQUESTER"].id,
                requester_name="David Chen",
                department="IT Infrastructure",
                title="Enterprise GPU Server Cluster Extension",
                justification="Expanding local ML model evaluation workloads and real-time inference latency requirements.",
                total_amount=43800.0,
                priority="HIGH",
                status="CONVERTED_TO_PO",
                approval_level_required=2,
                current_approval_level=2,
                items=[
                    RequisitionItem(
                        description="NVIDIA L40S 48GB Server Blade Module",
                        item_code="GPU-L40S",
                        quantity=4.0,
                        unit_of_measure="Units",
                        estimated_unit_price=8500.0,
                        estimated_total=34000.0,
                        suggested_supplier="Nexus Cloud Networks"
                    ),
                    RequisitionItem(
                        description="Dual Xeon Platinum 64-Core Compute Host",
                        item_code="SRV-DUAL-XEON",
                        quantity=1.0,
                        unit_of_measure="Units",
                        estimated_unit_price=9800.0,
                        estimated_total=9800.0,
                        suggested_supplier="Nexus Cloud Networks"
                    )
                ]
            )
            db.add(req1)
            db.flush()
            print("✓ Created Requisition: REQ-202610-0001")

        # 6. Requisition (Pending Approval for interactive UI demonstration)
        req2 = db.query(Requisition).filter(Requisition.requisition_number == "REQ-202610-0002").first()
        if not req2:
            req2 = Requisition(
                organization_id=org.id,
                requisition_number="REQ-202610-0002",
                requester_id=user_map["REQUESTER"].id,
                requester_name="David Chen",
                department="Operations",
                title="High-Density Warehouse Barcode Scanners & Thermal Printers",
                justification="Upgrading receiving docks with Wi-Fi 6 rugged scanners to accelerate inventory intake.",
                total_amount=8750.0,
                priority="MEDIUM",
                status="PENDING_APPROVAL",
                approval_level_required=1,
                current_approval_level=1,
                items=[
                    RequisitionItem(
                        description="Zebra TC58 Rugged Mobile Computer Scanners",
                        item_code="WHS-SCN-01",
                        quantity=5.0,
                        unit_of_measure="Units",
                        estimated_unit_price=1250.0,
                        estimated_total=6250.0,
                        suggested_supplier="Starlight Industrial Supplies"
                    ),
                    RequisitionItem(
                        description="Industrial Thermal Label Printers 300DPI",
                        item_code="WHS-PRT-02",
                        quantity=2.0,
                        unit_of_measure="Units",
                        estimated_unit_price=1250.0,
                        estimated_total=2500.0,
                        suggested_supplier="Starlight Industrial Supplies"
                    )
                ]
            )
            db.add(req2)
            db.flush()
            print("✓ Created Requisition: REQ-202610-0002 (Pending Approval)")

        # 7. RFQ and Quotations
        rfq1 = db.query(RFQ).filter(RFQ.rfq_number == "RFQ-202610-0001").first()
        if not rfq1:
            rfq1 = RFQ(
                organization_id=org.id,
                rfq_number="RFQ-202610-0001",
                requisition_id=req1.id,
                title="Sourcing Enterprise GPU Server Nodes",
                description="Sealed competitive quotation for 4x L40S modules and dual-socket enterprise compute chassis.",
                submission_deadline=datetime.now(timezone.utc) + timedelta(days=5),
                status="AWARDED",
                quotations=[
                    Quotation(
                        supplier_id=supplier_map["SUP-101"].id,
                        quotation_number="QUO-NEXUS-881",
                        total_amount=43800.0,
                        currency="USD",
                        lead_time_days=7,
                        status="AWARDED",
                        notes="Factory sealed with 3-year enterprise OEM on-site warranty.",
                        items=[
                            QuotationItem(description="NVIDIA L40S 48GB Server Blade Module", quantity=4.0, unit_price=8500.0, total_price=34000.0),
                            QuotationItem(description="Dual Xeon Platinum 64-Core Compute Host", quantity=1.0, unit_price=9800.0, total_price=9800.0)
                        ]
                    ),
                    Quotation(
                        supplier_id=supplier_map["SUP-104"].id,
                        quotation_number="QUO-QUANTUM-204",
                        total_amount=46500.0,
                        currency="USD",
                        lead_time_days=14,
                        status="REJECTED",
                        notes="Subject to stock availability at Austin distribution hub.",
                        items=[
                            QuotationItem(description="NVIDIA L40S 48GB Server Blade Module", quantity=4.0, unit_price=8900.0, total_price=35600.0),
                            QuotationItem(description="Dual Xeon Platinum 64-Core Compute Host", quantity=1.0, unit_price=10900.0, total_price=10900.0)
                        ]
                    )
                ]
            )
            db.add(rfq1)
            db.flush()
            print("✓ Created RFQ-202610-0001 with 2 Quotations (Nexus awarded)")

        # 8. Purchase Order
        po1 = db.query(PurchaseOrder).filter(PurchaseOrder.po_number == "PO-202610-0001").first()
        if not po1:
            po1 = PurchaseOrder(
                organization_id=org.id,
                po_number="PO-202610-0001",
                supplier_id=supplier_map["SUP-101"].id,
                requisition_id=req1.id,
                quotation_id=rfq1.quotations[0].id,
                order_date=datetime.now(timezone.utc) - timedelta(days=6),
                expected_delivery_date=datetime.now(timezone.utc) + timedelta(days=2),
                subtotal=43800.0,
                tax_amount=3504.0,
                total_amount=47304.0,
                currency="USD",
                payment_terms="Net 30",
                delivery_address="Apex Global Tech HQ, Data Center 1, Receiving Bay 4",
                status="PARTIALLY_RECEIVED",
                items=[
                    PurchaseOrderItem(
                        description="NVIDIA L40S 48GB Server Blade Module",
                        quantity=4.0,
                        unit_price=8500.0,
                        total_price=34000.0,
                        received_quantity=4.0 # Fully received
                    ),
                    PurchaseOrderItem(
                        description="Dual Xeon Platinum 64-Core Compute Host",
                        quantity=1.0,
                        unit_price=9800.0,
                        total_price=9800.0,
                        received_quantity=0.0 # Pending delivery
                    )
                ]
            )
            db.add(po1)
            db.flush()
            print("✓ Created Purchase Order: PO-202610-0001 (Partially Received)")

        # 9. Goods Receipt
        gr1 = db.query(GoodsReceipt).filter(GoodsReceipt.receipt_number == "REC-202610-0001").first()
        if not gr1:
            gr1 = GoodsReceipt(
                organization_id=org.id,
                receipt_number="REC-202610-0001",
                purchase_order_id=po1.id,
                supplier_name="Nexus Cloud Networks",
                received_by="Tom Hardy",
                receipt_date=datetime.now(timezone.utc) - timedelta(days=1),
                receiving_location="Data Center Bay 4",
                status="ACCEPTED",
                items=[
                    GoodsReceiptItem(
                        po_item_id=po1.items[0].id,
                        description="NVIDIA L40S 48GB Server Blade Module",
                        quantity_received=4.0,
                        quantity_accepted=4.0,
                        quantity_rejected=0.0
                    )
                ]
            )
            db.add(gr1)
            db.flush()
            print("✓ Created Goods Receipt: REC-202610-0001")

        # 10. Invoices (1 Matched, 1 Exception to demo 3-Way Match)
        inv1 = db.query(Invoice).filter(Invoice.invoice_number == "INV-NEXUS-901").first()
        if not inv1:
            inv1 = Invoice(
                organization_id=org.id,
                purchase_order_id=po1.id,
                supplier_id=supplier_map["SUP-101"].id,
                supplier_name="Nexus Cloud Networks",
                invoice_number="INV-NEXUS-901",
                invoice_date=datetime.now(timezone.utc) - timedelta(days=1),
                due_date=datetime.now(timezone.utc) + timedelta(days=29),
                subtotal=34000.0,
                tax_amount=2720.0,
                total_amount=36720.0,
                currency="USD",
                match_status="MATCHED",
                payment_status="APPROVED_FOR_PAYMENT",
                notes="Billed for 4x NVIDIA L40S units verified and accepted at receiving bay.",
                items=[
                    InvoiceItem(
                        po_item_id=po1.items[0].id,
                        description="NVIDIA L40S 48GB Server Blade Module",
                        quantity=4.0,
                        unit_price=8500.0,
                        total_price=34000.0
                    )
                ]
            )
            db.add(inv1)
            print("✓ Created Invoice 1: INV-NEXUS-901 (MATCHED & APPROVED)")

        inv2 = db.query(Invoice).filter(Invoice.invoice_number == "INV-NEXUS-902-DISC").first()
        if not inv2:
            inv2 = Invoice(
                organization_id=org.id,
                purchase_order_id=po1.id,
                supplier_id=supplier_map["SUP-101"].id,
                supplier_name="Nexus Cloud Networks",
                invoice_number="INV-NEXUS-902-DISC",
                invoice_date=datetime.now(timezone.utc),
                due_date=datetime.now(timezone.utc) + timedelta(days=30),
                subtotal=11200.0,
                tax_amount=896.0,
                total_amount=12096.0,
                currency="USD",
                match_status="EXCEPTION",
                payment_status="UNPAID",
                exception_reason="Price discrepancy on 'Dual Xeon Platinum 64-Core Compute Host': Invoiced $11,200.00 vs PO $9,800.00. | Quantity discrepancy: Invoiced 1.0 exceeds Goods Received 0.0.",
                notes="Premature billing for unreceived compute host with inflated unit price.",
                items=[
                    InvoiceItem(
                        po_item_id=po1.items[1].id,
                        description="Dual Xeon Platinum 64-Core Compute Host",
                        quantity=1.0,
                        unit_price=11200.0,
                        total_price=11200.0
                    )
                ]
            )
            db.add(inv2)
            print("✓ Created Invoice 2: INV-NEXUS-902-DISC (EXCEPTION - 3-Way Discrepancy)")

        # 11. Audit Logs
        logs = [
            ("REGISTER", "Organization", org.id, "System initialized organization Apex Global Technologies"),
            ("CREATE", "Supplier", supplier_map["SUP-101"].id, "Onboarded and approved Tier-1 IT Hardware vendor Nexus Cloud Networks"),
            ("APPROVE_FINAL", "Requisition", req1.id, "Executive approval granted for GPU cluster expansion ($43,800.00)"),
            ("AWARD_QUOTATION", "Quotation", rfq1.quotations[0].id, "Awarded competitive tender RFQ-202610-0001 to Nexus Cloud Networks"),
            ("GOODS_RECEIPT", "GoodsReceipt", gr1.id, "Warehouse intake verified: 4x L40S modules passed serial inspection"),
            ("3_WAY_MATCH", "Invoice", inv1.id, "Automated 3-way match passed with zero variance against PO-202610-0001"),
            ("EXCEPTION_FLAGGED", "Invoice", inv2.id, "Flagged price variance + unreceived line item on invoice INV-NEXUS-902-DISC")
        ]
        for act, ent, eid, det in logs:
            db.add(
                AuditLog(
                    organization_id=org.id,
                    actor_name="Procurement Automation System",
                    action=act,
                    entity_type=ent,
                    entity_id=eid,
                    details=det,
                    ip_address="127.0.0.1"
                )
            )

        # 12. Notifications
        db.add(
            Notification(
                organization_id=org.id,
                title="Action Required: Invoice 3-Way Discrepancy",
                message="Invoice INV-NEXUS-902-DISC has a price and receipt mismatch. Finance review required.",
                link="/invoices",
                is_read=False
            )
        )
        db.add(
            Notification(
                organization_id=org.id,
                title="Pending Requisition Approval",
                message="Requisition REQ-202610-0002 ($8,750.00) is awaiting managerial sign-off.",
                link="/approvals",
                is_read=False
            )
        )

        db.commit()
        print("✅ Database seeding successfully completed with realistic procurement lifecycle data!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
