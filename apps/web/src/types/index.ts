export type UserRole =
  | 'ADMIN'
  | 'PROCUREMENT_MANAGER'
  | 'REQUESTER'
  | 'APPROVER'
  | 'FINANCE'
  | 'WAREHOUSE'
  | 'SUPPLIER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id: string;
  organization_name: string;
  currency?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  legal_name?: string;
  tax_id?: string;
  category: string;
  contact_person?: string;
  email: string;
  phone?: string;
  address?: string;
  country: string;
  website?: string;
  payment_terms: string;
  currency: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'INACTIVE';
  rating: number;
  notes?: string;
  created_at: string;
}

export interface RequisitionItem {
  id?: string;
  description: string;
  item_code?: string;
  quantity: number;
  unit_of_measure: string;
  estimated_unit_price: number;
  estimated_total?: number;
  suggested_supplier?: string;
}

export interface Requisition {
  id: string;
  requisition_number: string;
  requester_id: string;
  requester_name: string;
  department: string;
  title: string;
  justification?: string;
  total_amount: number;
  currency: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'PENDING_APPROVAL'
    | 'CHANGES_REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'CONVERTED_TO_PO';
  approval_level_required: number;
  current_approval_level: number;
  created_at: string;
  items: RequisitionItem[];
}

export interface QuotationItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  currency: string;
  lead_time_days: number;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'AWARDED' | 'REJECTED';
  submitted_at: string;
  items: QuotationItem[];
}

export interface RFQ {
  id: string;
  rfq_number: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'EVALUATING' | 'AWARDED' | 'CLOSED' | 'CANCELLED';
  submission_deadline?: string;
  created_at: string;
  quotations_count?: number;
  quotations?: Quotation[];
}

export interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  supplier_email?: string;
  order_date: string;
  expected_delivery_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_terms: string;
  delivery_address: string;
  status:
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'ISSUED'
    | 'ACKNOWLEDGED'
    | 'PARTIALLY_RECEIVED'
    | 'FULLY_RECEIVED'
    | 'CLOSED'
    | 'CANCELLED';
  items_count?: number;
  fulfillment?: string;
  items?: PurchaseOrderItem[];
}

export interface GoodsReceipt {
  id: string;
  receipt_number: string;
  po_id: string;
  po_number: string;
  supplier_name: string;
  received_by: string;
  receipt_date: string;
  receiving_location: string;
  status: 'ACCEPTED' | 'PARTIAL' | 'DISCREPANCY';
  items_count: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  po_id: string;
  po_number: string;
  supplier_name: string;
  invoice_date: string;
  due_date?: string;
  total_amount: number;
  currency: string;
  match_status: 'PENDING' | 'MATCHED' | 'EXCEPTION' | 'RESOLVED';
  payment_status: 'UNPAID' | 'APPROVED_FOR_PAYMENT' | 'PAID' | 'REJECTED';
  exception_reason?: string;
}

export interface Budget {
  id: string;
  department: string;
  fiscal_year: number;
  allocated_amount: number;
  committed_amount: number;
  actual_spent: number;
  remaining_amount: number;
  utilization_percent: number;
  currency: string;
}

export interface AuditLog {
  id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
