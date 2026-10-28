import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    currency = Column(String(10), default="USD")
    timezone = Column(String(50), default="UTC")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    suppliers = relationship("Supplier", back_populates="organization", cascade="all, delete-orphan")
    requisitions = relationship("Requisition", back_populates="organization", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="organization", cascade="all, delete-orphan")
    rfqs = relationship("RFQ", back_populates="organization", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="organization", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="organization", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="REQUESTER") # ADMIN, PROCUREMENT_MANAGER, REQUESTER, APPROVER, FINANCE, WAREHOUSE, SUPPLIER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="users")

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    code = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    legal_name = Column(String(255), nullable=True)
    tax_id = Column(String(100), nullable=True)
    category = Column(String(100), default="General Goods")
    contact_person = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False)
    phone = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    country = Column(String(100), default="United States")
    website = Column(String(255), nullable=True)
    payment_terms = Column(String(100), default="Net 30")
    currency = Column(String(10), default="USD")
    bank_name = Column(String(100), nullable=True)
    bank_account = Column(String(100), nullable=True)
    status = Column(String(50), default="APPROVED") # DRAFT, PENDING_REVIEW, APPROVED, REJECTED, SUSPENDED, INACTIVE
    rating = Column(Float, default=4.5)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="suppliers")
    quotations = relationship("Quotation", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    department = Column(String(100), nullable=False)
    fiscal_year = Column(Integer, default=2026)
    allocated_amount = Column(Float, default=0.0)
    committed_amount = Column(Float, default=0.0)
    actual_spent = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="budgets")

class Requisition(Base):
    __tablename__ = "requisitions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    requisition_number = Column(String(50), nullable=False, index=True)
    requester_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    requester_name = Column(String(255), nullable=False)
    department = Column(String(100), default="Operations")
    title = Column(String(255), nullable=False)
    justification = Column(Text, nullable=True)
    total_amount = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, URGENT
    status = Column(String(50), default="DRAFT") # DRAFT, SUBMITTED, PENDING_APPROVAL, CHANGES_REQUESTED, APPROVED, REJECTED, CANCELLED, CONVERTED_TO_PO
    approval_level_required = Column(Integer, default=1)
    current_approval_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="requisitions")
    items = relationship("RequisitionItem", back_populates="requisition", cascade="all, delete-orphan")
    approval_decisions = relationship("ApprovalDecision", back_populates="requisition", cascade="all, delete-orphan")

class RequisitionItem(Base):
    __tablename__ = "requisition_items"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    requisition_id = Column(String(36), ForeignKey("requisitions.id"), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    item_code = Column(String(100), nullable=True)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_of_measure = Column(String(50), default="Units")
    estimated_unit_price = Column(Float, nullable=False, default=0.0)
    estimated_total = Column(Float, nullable=False, default=0.0)
    suggested_supplier = Column(String(255), nullable=True)

    requisition = relationship("Requisition", back_populates="items")

class ApprovalDecision(Base):
    __tablename__ = "approval_decisions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    requisition_id = Column(String(36), ForeignKey("requisitions.id"), nullable=False, index=True)
    approver_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    approver_name = Column(String(255), nullable=False)
    level = Column(Integer, default=1)
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, CHANGES_REQUESTED
    comments = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    requisition = relationship("Requisition", back_populates="approval_decisions")

class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    rfq_number = Column(String(50), nullable=False, index=True)
    requisition_id = Column(String(36), ForeignKey("requisitions.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    submission_deadline = Column(DateTime, nullable=True)
    status = Column(String(50), default="PUBLISHED") # DRAFT, PUBLISHED, EVALUATING, AWARDED, CLOSED, CANCELLED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="rfqs")
    quotations = relationship("Quotation", back_populates="rfq", cascade="all, delete-orphan")

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    rfq_id = Column(String(36), ForeignKey("rfqs.id"), nullable=False, index=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False, index=True)
    quotation_number = Column(String(50), nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(10), default="USD")
    lead_time_days = Column(Integer, default=7)
    validity_days = Column(Integer, default=30)
    payment_terms = Column(String(100), default="Net 30")
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="SUBMITTED") # SUBMITTED, UNDER_REVIEW, AWARDED, REJECTED
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    rfq = relationship("RFQ", back_populates="quotations")
    supplier = relationship("Supplier", back_populates="quotations")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")

class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    quotation_id = Column(String(36), ForeignKey("quotations.id"), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)

    quotation = relationship("Quotation", back_populates="items")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    po_number = Column(String(50), nullable=False, index=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False, index=True)
    requisition_id = Column(String(36), ForeignKey("requisitions.id"), nullable=True)
    quotation_id = Column(String(36), ForeignKey("quotations.id"), nullable=True)
    order_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expected_delivery_date = Column(DateTime, nullable=True)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    payment_terms = Column(String(100), default="Net 30")
    delivery_address = Column(Text, default="HQ Central Distribution, Dock 4")
    status = Column(String(50), default="ISSUED") # DRAFT, PENDING_APPROVAL, APPROVED, ISSUED, ACKNOWLEDGED, PARTIALLY_RECEIVED, FULLY_RECEIVED, CLOSED, CANCELLED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="purchase_orders")
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    goods_receipts = relationship("GoodsReceipt", back_populates="purchase_order")
    invoices = relationship("Invoice", back_populates="purchase_order")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    purchase_order_id = Column(String(36), ForeignKey("purchase_orders.id"), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)
    received_quantity = Column(Float, default=0.0)

    purchase_order = relationship("PurchaseOrder", back_populates="items")

class GoodsReceipt(Base):
    __tablename__ = "goods_receipts"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    receipt_number = Column(String(50), nullable=False, index=True)
    purchase_order_id = Column(String(36), ForeignKey("purchase_orders.id"), nullable=False, index=True)
    supplier_name = Column(String(255), nullable=False)
    received_by = Column(String(255), nullable=False)
    receipt_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    receiving_location = Column(String(100), default="Central Warehouse Bay 2")
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="ACCEPTED") # ACCEPTED, PARTIAL, DISCREPANCY
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    purchase_order = relationship("PurchaseOrder", back_populates="goods_receipts")
    items = relationship("GoodsReceiptItem", back_populates="goods_receipt", cascade="all, delete-orphan")

class GoodsReceiptItem(Base):
    __tablename__ = "goods_receipt_items"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    goods_receipt_id = Column(String(36), ForeignKey("goods_receipts.id"), nullable=False, index=True)
    po_item_id = Column(String(36), ForeignKey("purchase_order_items.id"), nullable=False)
    description = Column(String(255), nullable=False)
    quantity_received = Column(Float, default=0.0)
    quantity_accepted = Column(Float, default=0.0)
    quantity_rejected = Column(Float, default=0.0)
    rejection_reason = Column(String(255), nullable=True)

    goods_receipt = relationship("GoodsReceipt", back_populates="items")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    purchase_order_id = Column(String(36), ForeignKey("purchase_orders.id"), nullable=False, index=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False, index=True)
    supplier_name = Column(String(255), nullable=False)
    invoice_number = Column(String(50), nullable=False, index=True)
    invoice_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    due_date = Column(DateTime, nullable=True)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    match_status = Column(String(50), default="PENDING") # PENDING, MATCHED, EXCEPTION, RESOLVED
    payment_status = Column(String(50), default="UNPAID") # UNPAID, APPROVED_FOR_PAYMENT, PAID
    exception_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="invoices")
    purchase_order = relationship("PurchaseOrder", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False, index=True)
    po_item_id = Column(String(36), ForeignKey("purchase_order_items.id"), nullable=True)
    description = Column(String(255), nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)

    invoice = relationship("Invoice", back_populates="items")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), nullable=False, index=True)
    actor_id = Column(String(36), nullable=True)
    actor_name = Column(String(255), nullable=False, default="System")
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(36), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
