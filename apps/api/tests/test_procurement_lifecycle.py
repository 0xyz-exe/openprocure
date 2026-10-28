def test_full_procurement_lifecycle(client):
    # 1. Register User
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "procurement.lead@enterprise.com",
        "password": "Password123!",
        "full_name": "Lead Officer",
        "organization_name": "Enterprise Ops Ltd",
        "role": "ADMIN"
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Supplier
    sup_res = client.post("/api/v1/suppliers", json={
        "code": "SUP-TEST-01",
        "name": "Global Chip Solutions",
        "email": "sales@globalchips.io",
        "category": "IT Hardware",
        "payment_terms": "Net 30",
        "status": "APPROVED"
    }, headers=headers)
    assert sup_res.status_code == 200
    supplier_id = sup_res.json()["id"]

    # 3. Create Requisition with 2 items
    req_res = client.post("/api/v1/requisitions", json={
        "title": "Data Center Flash Storage Expansion",
        "department": "Engineering",
        "priority": "HIGH",
        "items": [
            {
                "description": "NVMe Gen5 15.36TB Solid State Drive",
                "quantity": 10.0,
                "estimated_unit_price": 1200.0,
                "suggested_supplier": "Global Chip Solutions"
            },
            {
                "description": "PCIe 5.0 Host Bus Adapter 64G",
                "quantity": 2.0,
                "estimated_unit_price": 800.0
            }
        ]
    }, headers=headers)
    assert req_res.status_code == 200
    req_data = req_res.json()
    assert req_data["total_amount"] == 13600.0 # 10*1200 + 2*800
    assert req_data["status"] == "DRAFT"
    req_id = req_data["id"]

    # 4. Submit Requisition for approval
    submit_res = client.post(f"/api/v1/requisitions/{req_id}/submit", headers=headers)
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "PENDING_APPROVAL"

    # 5. Approve Requisition
    approve_res = client.post(f"/api/v1/approvals/{req_id}/action", json={
        "status": "APPROVED",
        "comments": "Approved for Q4 critical infrastructure budget."
    }, headers=headers)
    assert approve_res.status_code == 200

    # 6. Generate Purchase Order
    po_res = client.post("/api/v1/purchase-orders", json={
        "supplier_id": supplier_id,
        "requisition_id": req_id,
        "payment_terms": "Net 30",
        "delivery_address": "Dock 3, Main Facility",
        "items": [
            {
                "description": "NVMe Gen5 15.36TB Solid State Drive",
                "quantity": 10.0,
                "unit_price": 1200.0
            }
        ]
    }, headers=headers)
    assert po_res.status_code == 200
    po_data = po_res.json()
    po_id = po_data["id"]
    assert po_data["status"] == "ISSUED"

    # 7. Get PO details to grab PO item ID
    po_detail = client.get(f"/api/v1/purchase-orders/{po_id}", headers=headers).json()
    po_item_id = po_detail["items"][0]["id"]

    # 8. Test Over-Receipt Rejection (Attempt receiving 15 when ordered was 10)
    over_res = client.post("/api/v1/goods-receipts", json={
        "purchase_order_id": po_id,
        "receiving_location": "Dock 3",
        "items": [
            {
                "po_item_id": po_item_id,
                "description": "NVMe Gen5 15.36TB Solid State Drive",
                "quantity_received": 15.0,
                "quantity_accepted": 15.0
            }
        ]
    }, headers=headers)
    assert over_res.status_code == 400
    assert "Over-receipt rejected" in over_res.json()["detail"]

    # 9. Valid Goods Receipt for 8 units (Partial Delivery)
    gr_res = client.post("/api/v1/goods-receipts", json={
        "purchase_order_id": po_id,
        "receiving_location": "Dock 3",
        "items": [
            {
                "po_item_id": po_item_id,
                "description": "NVMe Gen5 15.36TB Solid State Drive",
                "quantity_received": 8.0,
                "quantity_accepted": 8.0,
                "quantity_rejected": 0.0
            }
        ]
    }, headers=headers)
    assert gr_res.status_code == 200
    assert gr_res.json()["po_status"] == "PARTIALLY_RECEIVED"

    # 10. Test 3-Way Match Exception (Invoice for 10 units when only 8 received)
    bad_inv = client.post("/api/v1/invoices", json={
        "purchase_order_id": po_id,
        "supplier_id": supplier_id,
        "invoice_number": "INV-TEST-ERR-01",
        "items": [
            {
                "po_item_id": po_item_id,
                "description": "NVMe Gen5 15.36TB Solid State Drive",
                "quantity": 10.0,
                "unit_price": 1200.0
            }
        ]
    }, headers=headers)
    assert bad_inv.status_code == 200
    assert bad_inv.json()["match_status"] == "EXCEPTION"
    assert "Quantity discrepancy" in bad_inv.json()["exception_reason"]

    # 11. Test 3-Way Match Success (Invoice for exactly 8 units received)
    good_inv = client.post("/api/v1/invoices", json={
        "purchase_order_id": po_id,
        "supplier_id": supplier_id,
        "invoice_number": "INV-TEST-OK-01",
        "items": [
            {
                "po_item_id": po_item_id,
                "description": "NVMe Gen5 15.36TB Solid State Drive",
                "quantity": 8.0,
                "unit_price": 1200.0
            }
        ]
    }, headers=headers)
    assert good_inv.status_code == 200
    assert good_inv.json()["match_status"] == "MATCHED"

    # 12. Approve and Pay Invoice
    good_inv_id = good_inv.json()["id"]
    pay_res = client.post(f"/api/v1/invoices/{good_inv_id}/pay", headers=headers)
    assert pay_res.status_code == 200
    assert pay_res.json()["payment_status"] == "PAID"
