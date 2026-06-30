import asyncio
import sys
import json
import urllib.request
import urllib.parse

sys.path.append("/Users/devsmac/Desktop/SutraOS/backend")
from database import SessionLocal
from sqlalchemy import select
from models import User

BASE_URL = "http://localhost:8000"

async def setup_faculty_role():
    print("1. Updating database: Assigning 'TRANSPORT_OFFICER' to faculty_cse_0's additional_roles...")
    async with SessionLocal() as session:
        res = await session.execute(select(User).where(User.username == "faculty_cse_0"))
        faculty = res.scalars().first()
        if not faculty:
            print("Faculty member 'faculty_cse_0' not found in database.")
            return False
        
        # Set transport role in additional_roles JSON list
        faculty.additional_roles = ["TRANSPORT_OFFICER"]
        await session.commit()
        print("Role updated successfully in DB.")
        return True

def run_api_tests():
    print("\n2. Logging in as faculty_cse_0...")
    login_data = urllib.parse.urlencode({"username": "faculty_cse_0", "password": "password123"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/token", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            token = res_data["access_token"]
    except Exception as e:
        print("Login failed:", e)
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n3. Invoking transport manager reservations route as faculty_cse_0...")
    req_trans = urllib.request.Request(f"{BASE_URL}/transport/reservations", headers=headers)
    try:
        with urllib.request.urlopen(req_trans) as response:
            res_data = json.loads(response.read().decode())
            print("Transport route response code: 200")
            print("Access GRANTED successfully via additional_roles!")
            print(f"Total reservations found: {len(res_data)}")
    except urllib.error.HTTPError as e:
        print(f"Access DENIED: {e.code} {e.reason}")
    except Exception as e:
        print("Error invoking route:", e)

if __name__ == "__main__":
    if asyncio.run(setup_faculty_role()):
        run_api_tests()
