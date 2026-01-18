"""Check the most recent session"""

import os

import requests
from dotenv import load_dotenv

load_dotenv()

session_id = "ae1537fa-650e-444f-8ed0-63668fccc363"

print(f"Checking session: {session_id}\n")

check_url = f"http://localhost:8000/api/session/{session_id}/debug"
print(f"URL: {check_url}\n")

try:
    response = requests.get(
        check_url, headers={"X-API-Key": os.getenv("BACKEND_API_KEY")}
    )
    if response.status_code == 200:
        data = response.json()
        print("=== SESSION STATE ===")
        for key, value in data.items():
            print(f"{key}: {value}")
    else:
        print(f"Error {response.status_code}: {response.text}")
except Exception as e:
    print(f"Failed: {e}")
