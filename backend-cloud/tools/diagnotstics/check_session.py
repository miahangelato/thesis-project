"""Check session state via debug endpoint"""

import os

import requests
from dotenv import load_dotenv

load_dotenv()

session_id = "cd1f1df1-ef06-4978-8f0f-05e844b99acc"
api_key = os.getenv("BACKEND_API_KEY")

headers = {"X-API-Key": api_key}
url = f"http://localhost:8000/api/session/{session_id}/debug"

print(f"Checking session: {session_id}")
print(f"URL: {url}")
print(f"API Key: {api_key[:10]}..." if api_key else "API Key: NOT SET")
print()

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print()

    if response.status_code == 200:
        data = response.json()
        print("Session State:")
        for key, value in data.items():
            print(f"  {key}: {value}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
