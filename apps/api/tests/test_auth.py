def test_auth_flow(client):
    # 1. Register Admin
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "testadmin@openprocure.org",
        "password": "SecurePassword123!",
        "full_name": "Test Administrator",
        "organization_name": "Acme Test Procurement Ltd",
        "role": "ADMIN"
    })
    assert reg_res.status_code == 200
    token_data = reg_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 2. Duplicate registration should fail
    dup_res = client.post("/api/v1/auth/register", json={
        "email": "testadmin@openprocure.org",
        "password": "AnotherPassword!",
        "full_name": "Duplicate User",
        "organization_name": "Acme Test Procurement Ltd",
        "role": "ADMIN"
    })
    assert dup_res.status_code == 400

    # 3. Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "testadmin@openprocure.org",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Invalid Login
    bad_login = client.post("/api/v1/auth/login", json={
        "email": "testadmin@openprocure.org",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # 5. Access /auth/me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "testadmin@openprocure.org"
