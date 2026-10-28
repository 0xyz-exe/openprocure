# Procurement Lifecycle & Business Workflows

OpenProcure digitizes the entire procure-to-pay (P2P) lifecycle:

```text
1. REQUISITION
   Requester creates Draft Requisition -> Adds line items -> Submits for review.
   Budget commitment hold is placed on Department Budget.
         │
         ▼
2. APPROVAL WORKFLOW
   Manager / Finance reviews queue.
   - Tier 1: Operations (< $10,000)
   - Tier 2: Executive (>= $10,000)
   Requester cannot approve their own requests (Conflict of Interest prevention).
   Decision recorded in immutable audit log.
         │
         ▼
3. RFQ & SOURCING
   Approved requisition converted to competitive Request for Quotation (RFQ).
   Invited vendors submit bids with item pricing, validity days, and lead times.
   Procurement Manager evaluates comparison matrix and awards winning quotation.
         │
         ▼
4. PURCHASE ORDER
   Purchase Order generated with deterministic sequence (PO-YYYYMM-XXXX).
   Issued to vendor with contractual payment and delivery terms.
         │
         ▼
5. GOODS RECEIPT (WAREHOUSE INTAKE)
   Shipment arrives at receiving dock.
   Warehouse officer verifies intake quantities.
   - Over-receipt prevention: System rejects intake exceeding ordered amount.
   - Atomically updates PO fulfillment (PARTIALLY_RECEIVED or FULLY_RECEIVED).
         │
         ▼
6. 3-WAY MATCHING & INVOICE RECONCILIATION
   Supplier submits invoice.
   Matching engine compares:
   - Invoice unit price vs Purchase Order unit price (1% tolerance)
   - Invoice billed quantity vs Goods Receipt accepted quantity
   - If variance detected -> Status set to EXCEPTION with explicit diagnostics.
   - If verified -> Status set to MATCHED, enabling payment authorization.
         │
         ▼
7. PAYMENT & SPEND LEDGER
   Finance approves payment.
   Actual spend recorded against Department Budget; commitment hold released.
```
