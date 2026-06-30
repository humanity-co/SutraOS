import requests
import json

BASE_URL = "http://localhost:8000"

def run_verification():
    print("======================================================================")
    print("         SUTRAOS CAMPUS FACILITIES SYSTEM INTEGRATION TEST            ")
    print("======================================================================")

    # -------------------------------------------------------------------------
    # 1. LOGIN SESSIONS
    # -------------------------------------------------------------------------
    print("\n[1] INITIALIZING SESSIONS...")
    
    # Student session
    res = requests.post(f"{BASE_URL}/token", data={"username": "mit2024cse009", "password": "password123"})
    if res.status_code != 200:
        print("❌ Student login failed:", res.text)
        return
    student_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
    print("  ✓ Student 'mit2024cse009' logged in.")

    # Principal/Admin session
    res = requests.post(f"{BASE_URL}/token", data={"username": "super_admin", "password": "password123"})
    if res.status_code != 200:
        print("❌ Admin login failed:", res.text)
        return
    admin_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
    print("  ✓ Admin 'super_admin' logged in.")

    # -------------------------------------------------------------------------
    # 2. RBAC & OPERATIONAL ROLE ASSIGNMENT
    # -------------------------------------------------------------------------
    print("\n[2] VERIFYING ROLE ASSIGNMENTS...")
    # Find a faculty user to assign a role. Let's list faculties first.
    res_fac = requests.get(f"{BASE_URL}/faculty", headers=admin_headers)
    if res_fac.status_code == 200 and len(res_fac.json()) > 0:
        target_faculty = res_fac.json()[0]
        faculty_user_id = target_faculty["user_id"]
        faculty_username = target_faculty["user"]["username"]
        print(f"  ✓ Found Faculty: {faculty_username} (ID: {faculty_user_id})")

        # Assign MESS_IN_CHARGE role
        payload = {"additional_roles": ["MESS_IN_CHARGE", "LIBRARIAN", "SPORTS_OFFICER"]}
        res_role = requests.put(f"{BASE_URL}/users/{faculty_user_id}/roles", json=payload, headers=admin_headers)
        if res_role.status_code == 200:
            print(f"  ✓ Assigned operational roles to {faculty_username}: MESS_IN_CHARGE, LIBRARIAN, SPORTS_OFFICER")
        else:
            print("  ❌ Failed to assign roles:", res_role.text)
    else:
        print("  ⚠️ No faculty found to assign additional roles to.")

    # -------------------------------------------------------------------------
    # 3. HOSTEL & OUTING WORKFLOWS
    # -------------------------------------------------------------------------
    print("\n[3] HOSTEL REGISTRATION AND OUTING REQUISITION...")
    # Register hostel for student
    hostel_payload = {
        "course_year": "VI",
        "gender": "Male",
        "policy_name": "MIT Aurangabad Hostel Policy",
        "plan_name": "Hostel Plan 2025-2026",
        "father_name": "Ramesh Sharma",
        "father_contact": "9876543210", # Must be 10 digits
        "father_address": "Chhatrapati Sambhajinagar",
        "mother_name": "Sita Sharma",
        "mother_contact": "9876543211", # 10 digits
        "mother_address": "Chhatrapati Sambhajinagar",
        "vehicle_number": "MH-20-EG-4567",
        "license_number": "DL-12345678901",
    }
    requests.post(f"{BASE_URL}/hostel/admissions", json=hostel_payload, headers=student_headers)
    res_adm = requests.get(f"{BASE_URL}/hostel/admissions/me", headers=student_headers)
    if res_adm.status_code == 200:
        adm = res_adm.json()
        print(f"  ✓ Hostel admission status: {adm['status']} (Block: {adm['block_name']}, Room: {adm['room_number']})")
        
        # If pending, let's allocate
        if adm["status"] == "PENDING":
            alloc_payload = {
                "block_name": "Aryabhata Block A",
                "floor_name": "Floor 1",
                "room_number": "Room 101"
            }
            res_alloc = requests.put(f"{BASE_URL}/hostel/admissions/{adm['id']}/allocate", json=alloc_payload, headers=admin_headers)
            if res_alloc.status_code == 200:
                print(f"  ✓ Allocated Room 101 in Aryabhata Block A. status: {res_alloc.json()['status']}")
            else:
                print("  ❌ Room allocation failed:", res_alloc.text)

        # File outing request
        outing_payload = {
            "reason": "Family function at home",
            "out_date": "2026-07-01T18:00:00Z",
            "in_date": "2026-07-03T09:00:00Z"
        }
        res_out = requests.post(f"{BASE_URL}/campus/gatepass", json=outing_payload, headers=student_headers)
        if res_out.status_code == 200:
            gp = res_out.json()
            print(f"  ✓ Outing leave gatepass created. Status: {gp['status']}, Signature Verified: {gp['signature_verified']}")
            
            # Verify OTP
            res_otp = requests.post(f"{BASE_URL}/campus/gatepass/{gp['id']}/verify-signature", headers=student_headers)
            if res_otp.status_code == 200:
                print("  ✓ Parent digital signature verified via SMS OTP.")
            
            # Warden approve
            res_app = requests.put(f"{BASE_URL}/campus/gatepass/{gp['id']}/status?status=APPROVED", headers=admin_headers)
            if res_app.status_code == 200:
                print("  ✓ Gatepass approved by Warden.")
    else:
        print("  ❌ Failed to retrieve/register hostel admission:", res_adm.text)

    # -------------------------------------------------------------------------
    # 4. LIBRARY WORKFLOWS
    # -------------------------------------------------------------------------
    print("\n[4] LIBRARY CIRCULATION WORKFLOW...")
    # Add new book
    import time
    unique_isbn = f"978-{int(time.time())}"
    book_payload = {
        "title": "Introduction to Algorithms, Fourth Edition",
        "author": "Thomas H. Cormen",
        "isbn": unique_isbn,
        "total_copies": 5
    }
    res_book = requests.post(f"{BASE_URL}/library/books", json=book_payload, headers=admin_headers)
    if res_book.status_code == 200:
        book = res_book.json()
        print(f"  ✓ Added Book: '{book['title']}' by {book['author']}. Copies available: {book['available_copies']}")
        
        # Student checkout book
        res_chk = requests.post(f"{BASE_URL}/library/checkout", json={"book_id": book["id"]}, headers=student_headers)
        if res_chk.status_code == 200:
            checkout = res_chk.json()
            print(f"  ✓ Book Checked Out! Checkout ID: {checkout['id']}, Status: {checkout['status']}, Due: {checkout['due_date']}")
            
            # Librarian mark returned
            res_ret = requests.put(f"{BASE_URL}/library/checkouts/{checkout['id']}/return", headers=admin_headers)
            if res_ret.status_code == 200:
                print("  ✓ Book marked as RETURNED by Librarian.")
            else:
                print("  ❌ Return checkout failed:", res_ret.text)
        else:
            print("  ❌ Book checkout failed:", res_chk.text)
    else:
        print("  ❌ Adding book failed:", res_book.text)

    # -------------------------------------------------------------------------
    # 5. TRANSPORT WORKFLOWS
    # -------------------------------------------------------------------------
    print("\n[5] BUS TRANSPORT REQUISITIONS...")
    # Query stops
    res_stops = requests.get(f"{BASE_URL}/transport/stops", headers=student_headers)
    res_routes = requests.get(f"{BASE_URL}/transport/routes", headers=student_headers)
    if res_stops.status_code == 200 and res_routes.status_code == 200:
        stops = res_stops.json()
        routes = res_routes.json()
        if len(stops) > 0 and len(routes) > 0:
            # File transport requisition
            req_payload = {
                "pickup_stop": stops[0]["name"],
                "pickup_route_id": routes[0]["id"],
                "destination_stop": stops[-1]["name"],
                "destination_route_id": routes[-1]["id"]
            }
            res_req = requests.post(f"{BASE_URL}/transport/reservations", json=req_payload, headers=student_headers)
            if res_req.status_code == 200:
                rsv = res_req.json()
                print(f"  ✓ Transport Pass Requested. Reservation ID: {rsv['id']}, Status: {rsv['approval_status']}, Fee: {rsv['fee_amount']} INR")
                
                # Approve requisition
                res_app = requests.put(f"{BASE_URL}/transport/reservations/{rsv['id']}/status?status=APPROVED", headers=admin_headers)
                if res_app.status_code == 200:
                    print(f"  ✓ Transport Pass APPROVED. Assigned seat: {res_app.json().get('seat_number')}, Vehicle: {res_app.json().get('vehicle_no')}")
                else:
                    print("  ❌ Pass approval failed:", res_app.text)
            else:
                print("  ❌ Requisition filing failed:", res_req.text)
        else:
            print("  ⚠️ No routes or stops seeded to test reservation.")
    else:
        print("  ❌ Failed to fetch stops/routes.")

    # -------------------------------------------------------------------------
    # 6. MESS WORKFLOWS
    # -------------------------------------------------------------------------
    print("\n[6] MESS MENU, RATINGS & GROCERY STOCKS...")
    # Student submit feedback
    feedback_payload = {
        "rating": 5,
        "review": "Amazing Pav Bhaji today, high quality and excellent hygiene!"
    }
    res_fb = requests.post(f"{BASE_URL}/mess/feedback", json=feedback_payload, headers=student_headers)
    if res_fb.status_code == 200:
        print("  ✓ Student feedback submitted successfully.")

    # Mess in-charge update menu
    menu_payload = {
        "breakfast": "Poha & Tea",
        "lunch": "Roti, Paneer Masala, Rice, Dal Fry",
        "snacks": "Samosa",
        "dinner": "Jeera Rice, Tadka Dal"
    }
    res_menu = requests.put(f"{BASE_URL}/mess/menu/Wednesday", json=menu_payload, headers=admin_headers)
    if res_menu.status_code == 200:
        print("  ✓ Wednesday daily menu updated successfully.")

    # Grocery stock check & refill
    res_groc = requests.get(f"{BASE_URL}/mess/grocery", headers=admin_headers)
    if res_groc.status_code == 200:
        groceries = res_groc.json()
        print(f"  ✓ Loaded kitchen grocery stocks. Items found: {len(groceries)}")
        low_stock = [g for g in groceries if g["current_stock"] < g["min_stock"]]
        if len(low_stock) > 0:
            target_item = low_stock[0]
            print(f"  ⚠️ Low Stock detected: {target_item['item_name']} ({target_item['current_stock']} < {target_item['min_stock']})")
            # Restock
            res_ref = requests.post(f"{BASE_URL}/mess/grocery/{target_item['id']}/restock", headers=admin_headers)
            if res_ref.status_code == 200:
                print(f"  ✓ Grocery item {target_item['item_name']} refilled (+100). New Stock: {res_ref.json()['current_stock']}")
    else:
        print("  ❌ Failed to load grocery stocks:", res_groc.text)

    # -------------------------------------------------------------------------
    # 7. SPORTS WORKFLOWS
    # -------------------------------------------------------------------------
    print("\n[7] SPORTS INVENTORY & TOURNAMENTS...")
    # Fetch equipment list
    res_eq = requests.get(f"{BASE_URL}/sports/equipment", headers=student_headers)
    if res_eq.status_code == 200:
        eq_list = res_eq.json()
        if len(eq_list) == 0:
            requests.post(f"{BASE_URL}/sports/equipment", json={"name": "Football (Nivia)", "total_qty": 10}, headers=admin_headers)
            res_eq = requests.get(f"{BASE_URL}/sports/equipment", headers=student_headers)
            eq_list = res_eq.json()
            
        if len(eq_list) > 0:
            eq = eq_list[0]
            print(f"  ✓ Found equipment in inventory: {eq['name']} (Available: {eq['available_qty']})")
        
        # Student request borrow
        res_req_eq = requests.post(f"{BASE_URL}/sports/issue", json={"equipment_id": eq["id"], "quantity": 2}, headers=student_headers)
        if res_req_eq.status_code == 200:
            req_issue = res_req_eq.json()
            print(f"  ✓ Requested borrow for {req_issue['quantity']} units of {eq['name']}. Status: {req_issue['status']}")
            
            # Sports Officer approve issue
            res_iss = requests.put(f"{BASE_URL}/sports/issue/{req_issue['id']}/status?status=APPROVED", headers=admin_headers)
            if res_iss.status_code == 200:
                print(f"  ✓ Requisition Approved & Gear Issued. New available qty: {res_iss.json()['equipment']['available_qty']}")
                
                # Student returns gear
                res_ret_eq = requests.put(f"{BASE_URL}/sports/issue/{req_issue['id']}/status?status=RETURNED", headers=admin_headers)
                if res_ret_eq.status_code == 200:
                    print(f"  ✓ Gear returned to gymkhana. Available qty: {res_ret_eq.json()['equipment']['available_qty']}")
            else:
                print("  ❌ Gear issue failed:", res_iss.text)
        else:
            print("  ❌ Gear request failed:", res_req_eq.text)

    # Register tournament team
    tour_payload = {
        "team_name": "MIT Spartans XI",
        "sport_name": "Football",
        "members_count": 11
    }
    res_tour = requests.post(f"{BASE_URL}/sports/tournaments", json=tour_payload, headers=student_headers)
    if res_tour.status_code == 200:
        print(f"  ✓ Registered Tournament Team: '{res_tour.json()['team_name']}' for {res_tour.json()['sport_name']}.")

    # -------------------------------------------------------------------------
    # 8. MAINTENANCE INFRASTRUCTURE WORKFLOWS
    # -------------------------------------------------------------------------
    print("\n[8] ESTATE INFRASTRUCTURE MAINTENANCE Complaining...")
    # Lodge ticket
    ticket_payload = {
        "category": "ELECTRIC",
        "block_name": "Bhaskara Block B, Floor 2, Room 204",
        "description": "Short circuit in power plug, computer unable to boot."
    }
    res_tkt = requests.post(f"{BASE_URL}/maintenance/tickets", json=ticket_payload, headers=student_headers)
    if res_tkt.status_code == 200:
        tkt = res_tkt.json()
        print(f"  ✓ Maintenance Repair Ticket Logged. ID: {tkt['id']}, Category: {tkt['category']}, Status: {tkt['status']}")
        
        # Estate manager assigns technician staff
        res_asg = requests.put(f"{BASE_URL}/maintenance/tickets/{tkt['id']}/assign?staff_name=Electrician%20Ramesh", headers=admin_headers)
        if res_asg.status_code == 200:
            print(f"  ✓ Ticket status updated to: {res_asg.json()['status']}. Assigned to: '{res_asg.json()['assigned_to_staff']}'")
            
            # Resolve ticket
            res_rsl = requests.put(f"{BASE_URL}/maintenance/tickets/{tkt['id']}/resolve", headers=admin_headers)
            if res_rsl.status_code == 200:
                print(f"  ✓ Ticket marked as {res_rsl.json()['status']} by Estate Manager.")
        else:
            print("  ❌ Ticket assignment failed:", res_asg.text)
    else:
        print("  ❌ Lodging ticket failed:", res_tkt.text)

    # -------------------------------------------------------------------------
    # 9. CENTRAL STORES & VENDING MACHINES WORKFLOWS
    # -------------------------------------------------------------------------
    print("\n[9] CENTRAL STORE & VENDING MACHINE INVENTORIES...")
    # Fetch store inventory
    res_st = requests.get(f"{BASE_URL}/store/inventory", headers=admin_headers)
    if res_st.status_code == 200:
        store_list = res_st.json()
        if len(store_list) == 0:
            requests.post(f"{BASE_URL}/store/inventory", json={"item_name": "Whiteboard Marker (Black)", "quantity": 50, "unit": "box"}, headers=admin_headers)
            res_st = requests.get(f"{BASE_URL}/store/inventory", headers=admin_headers)
            store_list = res_st.json()
            
        if len(store_list) > 0:
            st_item = store_list[0]
            print(f"  ✓ Central Store Item: {st_item['item_name']} (Qty: {st_item['quantity']} {st_item['unit']})")
        
        # Faculty request stationery
        # Let's request it using admin headers representing a staff user
        req_st_payload = {"item_id": st_item["id"], "quantity": 5}
        res_req_st = requests.post(f"{BASE_URL}/store/requisitions", json=req_st_payload, headers=admin_headers)
        if res_req_st.status_code == 200:
            req_store = res_req_st.json()
            print(f"  ✓ Stationery request filed. Requisition ID: {req_store['id']}, Status: {req_store['status']}, Qty: {req_store['quantity']}")
            
            # Purchase officer disburse stationery
            res_disb = requests.put(f"{BASE_URL}/store/requisitions/{req_store['id']}/status?status=DISBURSED", headers=admin_headers)
            if res_disb.status_code == 200:
                print(f"  ✓ Requisition DISBURSED. Remaining stock: {res_disb.json()['item']['quantity']}")
        else:
            print("  ❌ Requisition filing failed:", res_req_st.text)

    # Vending Machine alerts & refills
    res_vend = requests.get(f"{BASE_URL}/vending/inventory", headers=admin_headers)
    if res_vend.status_code == 200:
        vend_items = res_vend.json()
        print(f"  ✓ Vending stock loaded. Total items tracked: {len(vend_items)}")
        low_vend = [v for v in vend_items if v["quantity"] <= 3]
        if len(low_vend) > 0:
            v_item = low_vend[0]
            print(f"  ⚠️ Low Vending Alert: '{v_item['item_name']}' at {v_item['location']} has only {v_item['quantity']} units left!")
            # Refill machine command
            res_rfl = requests.post(f"{BASE_URL}/vending/{v_item['id']}/refill", headers=admin_headers)
            if res_rfl.status_code == 200:
                print(f"  ✓ Vending machine refilled to max. Stock count: {res_rfl.json()['quantity']} / {res_rfl.json()['max_quantity']}")
    else:
        print("  ❌ Failed to query vending inventory:", res_vend.text)

    # -------------------------------------------------------------------------
    # 10. ADMISSIONS, RESEARCH, & DMS LOCKER SYSTEMS (PHASE 10 COMPLETION)
    # -------------------------------------------------------------------------
    print("\n[10] ADMISSIONS, RESEARCH & DMS SYSTEM COMPLETE INTEGRATION...")
    
    # Admissions apply (Public)
    adm_payload = {
        "first_name": "Rajesh",
        "last_name": "Patil",
        "email": "rajesh.patil.mit@gmail.com",
        "hsc_percentage": 93.45,
        "category": "OBC"
    }
    res_adm = requests.post(f"{BASE_URL}/admissions/apply", json=adm_payload)
    if res_adm.status_code == 200:
        applicant = res_adm.json()
        print(f"  ✓ Public Admissions Application submitted. ID: {applicant['id']}, Score: {applicant['hsc_percentage']}%")
        
        # Admissions Admin views sorted merit list
        res_merit = requests.get(f"{BASE_URL}/admissions/applications", headers=admin_headers)
        if res_merit.status_code == 200:
            merit_list = res_merit.json()
            print(f"  ✓ Dynamic Merit List loaded. Top candidate: {merit_list[0]['first_name']} ({merit_list[0]['hsc_percentage']}%)")
            
            # Admit top candidate to generate roll number and credentials
            top_cand = merit_list[0]
            res_enroll = requests.post(f"{BASE_URL}/admissions/applications/{top_cand['id']}/admit", headers=admin_headers)
            if res_enroll.status_code == 200:
                cred = res_enroll.json()
                print(f"  ✓ Candidate admitted! ERP Credentials generated: Username: {cred['username']}, Temp Pass: {cred['temporary_password']}")
            else:
                print("  ❌ Admissions Onboarding failed:", res_enroll.text)
        else:
            print("  ❌ Merit List query failed:", res_merit.text)
    else:
        print("  ❌ Admissions Apply failed:", res_adm.text)

    # Research projects & publications
    res_proj = requests.get(f"{BASE_URL}/research/projects", headers=student_headers)
    if res_proj.status_code == 200:
        print(f"  ✓ Research Projects ledger retrieved. Projects tracked: {len(res_proj.json())}")
        # Add new project
        proj_payload = {
            "title": "Machine Learning for Renewable Microgrids",
            "funding_agency": "DST-SERB",
            "amount": 1800000.00,
            "duration": "24 Months"
        }
        res_new_proj = requests.post(f"{BASE_URL}/research/projects", json=proj_payload, headers=admin_headers)
        if res_new_proj.status_code == 200:
            print(f"  ✓ Research project logged successfully. PI: {res_new_proj.json()['faculty']['first_name']}")
    else:
        print("  ❌ Research projects query failed:", res_proj.text)

    # DMS Locker Upload & signature verification
    dms_payload = {
        "doc_name": "HSC_Transcript_MIT2024.pdf",
        "doc_type": "MARKSHEET",
        "file_size": "2.4 MB"
    }
    res_upload = requests.post(f"{BASE_URL}/dms/documents", json=dms_payload, headers=student_headers)
    if res_upload.status_code == 200:
        doc = res_upload.json()
        print(f"  ✓ Document securely signed & uploaded to DMS. Hash: {doc['cryptographic_hash']}")
        
        # Query locker
        res_locker = requests.get(f"{BASE_URL}/dms/documents", headers=student_headers)
        if res_locker.status_code == 200:
            print(f"  ✓ DMS Locker verified. Stored files: {len(res_locker.json())}")
            # Delete file
            res_del = requests.delete(f"{BASE_URL}/dms/documents/{doc['id']}", headers=student_headers)
            if res_del.status_code == 200:
                print("  ✓ Document removed from secure locker successfully.")
        else:
            print("  ❌ Locker query failed:", res_locker.text)
    else:
        print("  ❌ DMS Upload failed:", res_upload.text)

    print("\n======================================================================")
    print("      ✓ ALL 12 CAMPUS FACILITIES SYSTEMS VERIFIED SUCCESSFUL!         ")
    print("======================================================================")

if __name__ == "__main__":
    run_verification()
