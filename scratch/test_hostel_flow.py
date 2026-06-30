import requests

BASE_URL = "http://localhost:8000"

def run_test():
    print("--- Running Hostel Registration and Allocation Test ---")
    
    # 1. Log in as Student 2 (mit2024ce002) - should have pending or empty registration
    print("\n1. Logging in as Student 'mit2024ce002'...")
    res = requests.post(f"{BASE_URL}/token", data={"username": "mit2024ce002", "password": "password123"})
    if res.status_code != 200:
        print("Student login failed:", res.text)
        return
    student_token = res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    
    # Check current hostel admission for student 2
    res = requests.get(f"{BASE_URL}/hostel/admissions/me", headers=student_headers)
    if res.status_code == 200:
        admission = res.json()
        print(f"Current admission found: Status={admission['status']}, Room={admission['room_number']}, Block={admission['block_name']}")
    else:
        print("No current admission found. Registering a new application...")
        # Submit registration
        payload = {
            "course_year": "VI",
            "gender": "Female",
            "policy_name": "MIT Aurangabad Hostel Policy",
            "plan_name": "Hostel Plan 2025-2026",
            "father_name": "Sanjay Kulkarni",
            "father_contact": "9860123456",
            "father_address": "Aurangabad",
            "mother_name": "Sunita",
            "vehicle_number": "MH-20-AB-1234",
            "license_number": "LIC987654"
        }
        res_reg = requests.post(f"{BASE_URL}/hostel/admissions", json=payload, headers=student_headers)
        print("Registration response status:", res_reg.status_code)
        if res_reg.status_code == 200:
            admission = res_reg.json()
            print(f"Submitted! ID={admission['id']}, Status={admission['status']}, Room={admission['room_number']}, Block={admission['block_name']}")
        else:
            print("Registration failed:", res_reg.text)
            return

    # 2. Log in as Super Admin (warden) to allocate
    print("\n2. Logging in as Super Admin...")
    res = requests.post(f"{BASE_URL}/token", data={"username": "super_admin", "password": "password123"})
    if res.status_code != 200:
        print("Admin login failed:", res.text)
        return
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # List all admissions
    res_list = requests.get(f"{BASE_URL}/hostel/admissions", headers=admin_headers)
    print("List all admissions status:", res_list.status_code)
    admissions = res_list.json()
    pending = [a for a in admissions if a["status"] == "PENDING"]
    print(f"Found {len(admissions)} admissions total, {len(pending)} pending.")
    
    if len(pending) > 0:
        target_adm = pending[0]
        print(f"\n3. Allocating room for pending admission (ID: {target_adm['id']}, Student ID: {target_adm['student_id']})...")
        alloc_payload = {
            "block_name": "Aryabhata Block A",
            "floor_name": "Floor 2",
            "room_number": "Room 205"
        }
        res_alloc = requests.put(f"{BASE_URL}/hostel/admissions/{target_adm['id']}/allocate", json=alloc_payload, headers=admin_headers)
        print("Allocation response status:", res_alloc.status_code)
        if res_alloc.status_code == 200:
            updated_adm = res_alloc.json()
            print(f"Room allocated successfully! Room={updated_adm['room_number']}, Block={updated_adm['block_name']}, Status={updated_adm['status']}")
        else:
            print("Allocation failed:", res_alloc.text)
            return
    else:
        print("No pending admissions to allocate in this run.")

    # 4. Check fee invoices for the student to confirm 50,000 INR was billed
    print("\n4. Checking student's financial ledger fee invoices...")
    res_inv = requests.get(f"{BASE_URL}/finance/invoices/me", headers=student_headers)
    if res_inv.status_code == 200:
        invoices = res_inv.json()
        hostel_invoices = [i for i in invoices if "Hostel" in i["description"]]
        print(f"Found {len(hostel_invoices)} hostel invoices for student:")
        for idx, inv in enumerate(hostel_invoices):
            print(f"  [{idx+1}] ID={inv['id']}, Amount={inv['amount']}, Desc='{inv['description']}', Status={inv['status']}")
    else:
        print("Failed to get student invoices:", res_inv.text)

if __name__ == "__main__":
    run_test()
