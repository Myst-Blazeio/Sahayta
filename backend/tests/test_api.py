
import requests
import os
import time

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:5000/api")

def register_user(username, role="citizen", police_id=None):
    print(f"\n[Registering {role}] {username}...")
    try:
        unique_id = int(time.time())
        data = {
            "username": username,
            "password": "password123",
            "full_name": "Test User",
            "role": role,
            "email": f"{username}@example.com",
            "phone": f"9{str(unique_id)[-9:]}"
        }
        if role == "citizen":
            data["aadhar"] = f"1234{int(time.time())}" # Unique mock aadhar
        if role == "police":
            data["police_id"] = police_id or f"PID-{int(time.time())}"
            data["station_id"] = "100" # Use a valid station ID from get_stations
            
        resp = requests.post(f"{BASE_URL}/auth/register", json=data)
        if resp.status_code != 201:
             print(f"Registration Failed for {username}: {resp.status_code} - {resp.text}")
             return False
        print(f"Status: {resp.status_code} - {resp.json()}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def login_user(username):
    print(f"\n[Logging in] {username}...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "username": username,
            "password": "password123"
        })
        if resp.status_code == 200:
            token = resp.json().get('token')
            print("Login Successful.")
            return token
        else:
            print(f"Login Failed: {resp.text}")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def submit_fir(token):
    print("\n[Submitting FIR]...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        data = {
            "text": "My cycle was stolen from the park.",
            "language": "en",
            "incident_date": "2024-03-20",
            "incident_time": "14:30",
            "location": "Central Park",
            "station_id": "100"
        }
        resp = requests.post(f"{BASE_URL}/fir/", headers=headers, json=data)
        print(f"Status: {resp.status_code} - {resp.json()}")
        if resp.status_code == 201:
            fir_data = resp.json()
            fir_id = fir_data.get('fir_id')
            # Check for AI suggestions in the response if the backend returns them
            # (Note: My backend implementation currently returns message and fir_id only, 
            # but I can fetch the FIR to verify)
            return fir_id
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def police_action(token, fir_id):
    print("\n[Police Action] Fetching Pending & Updating...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # 1. Fetch Pending
        res = requests.get(f'{BASE_URL}/fir/pending', headers=headers)
        if res.status_code == 200:
            firs = res.json()
            print(f"Pending FIRs count: {len(firs)}")
            target = next((f for f in firs if f['_id'] == fir_id), None)
            if target:
                print(f"Found FIR {fir_id}")
            else:
                print("FIR not found in pending list (check db query?)")
        
        # 2. Update Status
        update_data = {
            "status": "resolved",
            "police_notes": "Cycle found and returned.",
            "applicable_sections": ["Section 379 IPC"]
        }
        res = requests.put(f'{BASE_URL}/fir/{fir_id}/update', json=update_data, headers=headers)
        print(f"Update Status: {res.status_code} - {res.json()}")
        
    except Exception as e:
        print(f"Error: {e}")

def check_notifications(token):
    print("\n[Checking Notifications]...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        res = requests.get(f'{BASE_URL}/fir/notifications', headers=headers)
        if res.status_code == 200:
            notifs = res.json()
            print(f"Notifications: {len(notifs)}")
            for n in notifs:
                print(f"- {n['message']} (Read: {n['is_read']})")
        else:
            print(f"Failed: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    ts = int(time.time())
    citizen_user = f"citizen_{ts}"
    police_user = f"police_{ts}"
    
    # 1. Setup Users
    register_user(citizen_user, "citizen")
    register_user(police_user, "police")
    
    # 2. Citizen Flow
    c_token = login_user(citizen_user)
    if c_token:
        fir_id = submit_fir(c_token)
        
        if fir_id:
            # 3. Police Flow
            p_token = login_user(police_user)
            if p_token:
                police_action(p_token, fir_id)
                
                # 4. Verify Notification
                check_notifications(c_token)

