
import requests
import os
import time
from bson import ObjectId

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:5000/api")

def register_police(username, station_id="100"):
    print(f"\n[Registering Police] {username} with Station {station_id}...")
    try:
        data = {
            "username": username,
            "password": "password123",
            "full_name": "Officer Test",
            "role": "police",
            "police_id": f"PID-{int(time.time())}",
            "station_id": station_id
        }
        resp = requests.post(f"{BASE_URL}/auth/register", json=data)
        if resp.status_code == 201:
            print("Registration Successful.")
            return True
        print(f"Registration Failed: {resp.text}")
        return False
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
        print(f"Login Failed: {resp.text}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def submit_manual_fir_no_station(token):
    print("\n[Submitting Manual FIR without station_id]...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        data = {
            "complainant_name": "Test Complainant",
            "complainant_phone": "9876543210",
            "text": "Manual report test.",
            "incident_date": "2024-03-20",
            "incident_time": "10:00",
            "location": "Test Street"
        }
        resp = requests.post(f"{BASE_URL}/fir/", headers=headers, json=data)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 201:
            fir_id = resp.json().get('fir_id')
            print(f"FIR Created: {fir_id}")
            return fir_id
        print(f"Submission Failed: {resp.text}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def verify_fir_station(token, fir_id, expected_station):
    print(f"\n[Verifying FIR {fir_id} has Station {expected_station}]...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.get(f"{BASE_URL}/fir/{fir_id}", headers=headers)
        if resp.status_code == 200:
            fir = resp.json()
            actual_station = fir.get('station_id')
            print(f"Actual Station ID: {actual_station}")
            if str(actual_station) == str(expected_station):
                print("SUCCESS: Station ID matches!")
                return True
            else:
                print(f"FAILURE: Station ID mismatch! Expected {expected_station}, got {actual_station}")
                return False
        print(f"Failed to fetch FIR details: {resp.text}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    ts = int(time.time())
    police_user = f"officer_{ts}"
    station_id = "100"
    
    if register_police(police_user, station_id):
        token = login_user(police_user)
        if token:
            fir_id = submit_manual_fir_no_station(token)
            if fir_id:
                verify_fir_station(token, fir_id, station_id)
