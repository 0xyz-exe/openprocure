from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: str = "Acme Global Enterprise"
    role: str = "ADMIN"

# Organization
class OrganizationOut(BaseModel):
    id: str
    name: str
    code: str
    currency: str
    timezone: str
    created_at: datetime
    class Config:
        from_attributes = True

# User
class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization_id: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Supplier
class SupplierCreate(BaseModel):
    code: str
    name: str
    legal_name: Optional[str] = None
    tax_id: Optional[str] = None
    category: str = "General Goods"
    contact_person: Optional[str] = None
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    country: str = "United States"
    website: Optional[str] = None
    payment_terms: str = "Net 30"
    currency: str = "USD"
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    status: str = "APPROVED"
    notes: Optional[str] = None

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[float] = None
    notes: Optional[str] = None

class SupplierOut(BaseModel):
    id: str
    code: str
    name: str
    legal_name: Optional[str] = None
    tax_id: Optional[str] = None
    category: str
    contact_person: Optional[str] = None
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    country: str
    website: Optional[str] = None
    payment_terms: str
    currency: str
    status: str
    rating: float
    notes: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Requisition
class RequisitionItemCreate(BaseModel):
    description: str
    item_code: Optional[str] = None
    quantity: float = 1.0
    unit_of_measure: str = "Units"
    estimated_unit_price: float = 0.0
    suggested_supplier: Optional[str] = None

class RequisitionItemOut(BaseModel):
    id: str
    description: str
    item_code: Optional[str] = None
    quantity: float
    unit_of_measure: str
    estimated_unit_price: float
    estimated_total: float
    suggested_supplier: Optional[str] = None
    class Config:
        from_attributes = True

class RequisitionCreate(BaseModel):
    title: str
    department: str = "Operations"
    justification: Optional[str] = None
    priority: str = "MEDIUM"
    currency: str = "USD"
    items: List[RequisitionItemCreate]

class RequisitionOut(BaseModel):
    id: str
    requisition_number: str
    requester_id: str
    requester_name: str
    department: str
    title: str
    justification: Optional[str] = None
    total_amount: float
    currency: str
    priority: str
    status: str
    approval_level_required: int
    current_approval_level: int
    created_at: datetime
    items: List[RequisitionItemOut] = []
    class Config:
        from_attributes = True

# Approval
class ApprovalAction(BaseModel):
    status: str # APPROVED, REJECTED, CHANGES_REQUESTED
    comments: Optional[str] = None

# RFQ & Quotations
class RFQCreate(BaseModel):
    title: str
    description: Optional[str] = None
    requisition_id: Optional[str] = None
    submission_deadline: Optional[datetime] = None
    supplier_ids: List[str] = []

class QuotationItemCreate(BaseModel):
    description: str
    quantity: float
    unit_price: float

class QuotationCreate(BaseModel):
    supplier_id: str
    quotation_number: str
    lead_time_days: int = 7
    validity_days: int = 30
    payment_terms: str = "Net 30"
    notes: Optional[str] = None
    items: List[QuotationItemCreate]

# Purchase Order
class PurchaseOrderItemCreate(BaseModel):
    description: str
    quantity: float
    unit_price: float

class PurchaseOrderCreate(BaseModel):
    supplier_id: str
    requisition_id: Optional[str] = None
    quotation_id: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None
    payment_terms: str = "Net 30"
    delivery_address: str = "HQ Central Distribution, Dock 4"
    items: List[PurchaseOrderItemCreate]

# Goods Receipt
class GoodsReceiptItemCreate(BaseModel):
    po_item_id: str
    description: str
    quantity_received: float
    quantity_accepted: float
    quantity_rejected: float = 0.0
    rejection_reason: Optional[str] = None

class GoodsReceiptCreate(BaseModel):
    purchase_order_id: str
    receiving_location: str = "Central Warehouse Bay 2"
    notes: Optional[str] = None
    items: List[GoodsReceiptItemCreate]

# Invoice & 3-Way Match
class InvoiceItemCreate(BaseModel):
    po_item_id: Optional[str] = None
    description: str
    quantity: float
    unit_price: float

class InvoiceCreate(BaseModel):
    purchase_order_id: str
    supplier_id: str
    invoice_number: str
    due_date: Optional[datetime] = None
    tax_amount: float = 0.0
    notes: Optional[str] = None
    items: List[InvoiceItemCreate]

class MatchResolution(BaseModel):
    action: str # RESOLVE, REJECT
    reason: str
