# OpenProcure — Database Design & Schema Specification

The database architecture is fully normalized and enforces strict relational integrity.

## 1. Core Domain Entities

### `organizations`
- `id` (UUID PK)
- `name` (VARCHAR)
- `code` (VARCHAR UNIQUE INDEX)
- `currency` (VARCHAR)
- `timezone` (VARCHAR)
- `created_at` (TIMESTAMP)

### `users`
- `id` (UUID PK)
- `organization_id` (UUID FK -> organizations.id)
- `email` (VARCHAR UNIQUE INDEX)
- `hashed_password` (VARCHAR)
- `full_name` (VARCHAR)
- `role` (ENUM: ADMIN, PROCUREMENT_MANAGER, REQUESTER, APPROVER, FINANCE, WAREHOUSE, SUPPLIER)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

### `suppliers`
- `id` (UUID PK)
- `organization_id` (UUID FK -> organizations.id)
- `code` (VARCHAR INDEX)
- `name` (VARCHAR)
- `category` (VARCHAR)
- `payment_terms` (VARCHAR)
- `rating` (FLOAT)
- `status` (DRAFT, PENDING_REVIEW, APPROVED, REJECTED, SUSPENDED, INACTIVE)

### `requisitions` & `requisition_items`
- `requisition_number` (Unique sequence number, e.g. `REQ-202610-0001`)
- `status` (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CHANGES_REQUESTED, CONVERTED_TO_PO)
- `total_amount` (Server-calculated monetary decimal)

### `purchase_orders` & `purchase_order_items`
- `po_number` (Unique sequence number, e.g. `PO-202610-0001`)
- `status` (DRAFT, ISSUED, PARTIALLY_RECEIVED, FULLY_RECEIVED, CLOSED, CANCELLED)
- `received_quantity` (Cumulative tracked count updated atomically on receipt)

### `goods_receipts` & `goods_receipt_items`
- `receipt_number` (e.g. `REC-202610-0001`)
- Over-receipt validation prevents received items exceeding outstanding order amounts.

### `invoices` & `invoice_items`
- `match_status` (PENDING, MATCHED, EXCEPTION, RESOLVED)
- `payment_status` (UNPAID, APPROVED_FOR_PAYMENT, PAID)
- `exception_reason` (Detailed mismatch diagnostic)

### `budgets`
- Tracks allocated, committed (holds from open requisitions), and actual spent amounts per department.

### `audit_logs`
- Append-only immutable trail logging actor, action, timestamp, entity, and modification details.
