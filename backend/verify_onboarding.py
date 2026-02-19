
import requests
import os
import time

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:5000/api")

def login_user(username, password="password123"):
    print(f"\n[Logging in] {username}...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "username": username,
            "password": password
        })
        if resp.status_code == 200:
            token = resp.json().get('token')
            print("Login Successful.")
            return token
        print(f"Login Failed: {resp.text}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def submit_manual_fir_onboard(police_token, citizen_username, citizen_password):
    print(f"\n[Police Submitting Manual FIR & Onboarding {citizen_username}]...")
    headers = {"Authorization": f"Bearer {police_token}"}
    try:
        data = {
            "complainant_name": f"User {citizen_username}",
            "complainant_phone": f"9{int(time.time()) % 1000000000}",
            "complainant_aadhar": f"A-{int(time.time())}",
            "complainant_email": f"{citizen_username}@example.com",
            "complainant_username": citizen_username,
            "complainant_password": citizen_password,
            "text": "Stolen smartphone report.",
            "incident_date": "2024-03-21",
            "incident_time": "15:00",
            "location": "Market Square"
        }
        resp = requests.post(f"{BASE_URL}/fir/", headers=headers, json=data)
        if resp.status_code == 201:
            fir_id = resp.json().get('fir_id')
            print(f"Success! FIR Created: {fir_id}")
            return fir_id
        print(f"Failed: {resp.status_code} - {resp.text}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def verify_citizen_dashboard(citizen_token, expected_fir_id):
    print(f"\n[Verifying {expected_fir_id} in Citizen Dashboard]...")
    headers = {"Authorization": f"Bearer {citizen_token}"}
    try:
        resp = requests.get(f"{BASE_URL}/fir/", headers=headers)
        if resp.status_code == 200:
            firs = resp.json()
            fir_ids = [f['_id'] for f in firs]
            if expected_fir_id in fir_ids:
                print("SUCCESS: FIR found in citizen portal!")
                return True
            else:
                print(f"FAILURE: FIR {expected_fir_id} NOT found in citizen portal.")
                print(f"Available FIRs: {fir_ids}")
                return False
        print(f"Failed to fetch user FIRs: {resp.text}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Assuming police user 'police1' exists from previous tests or setup
    # If not, registration would be needed. 
    # For verification, we'll try to login with a known police account or the one we just created in verify_fir_refactor.py
    
    # Let's find a police account (this part depends on actual DB state, so we might need a fresh one)
    ts = int(time.time())
    p_username = f"officer_v2_{ts}"
    c_username = f"citizen_v2_{ts}"
    c_password = "secure_pass_123"
    
    # 1. Register Police
    print(f"Registering police {p_username}...")
    reg_p = requests.post(f"{BASE_URL}/auth/register", json={
        "username": p_username,
        "password": "password123",
        "role": "police",
        "police_id": f"P2-{ts}",
        "station_id": "100"
    })
    
    if reg_p.status_code == 201:
        p_token = login_user(p_username)
        if p_token:
            # 2. Police submits manual FIR and onboards citizen
            fir_id = submit_manual_fir_onboard(p_token, c_username, c_password)
            if fir_id:
                # 3. Citizen logins for the first time
                print("\nWaiting for account propagation...")
                time.sleep(1) 
                c_token = login_user(c_username, c_password)
                if c_token:
                    # 4. Verify FIR is in citizen portal
                    verify_citizen_dashboard(c_token, fir_id)
