import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing env vars")
    sys.exit(1)

# Supabase REST API Root returns the OpenAPI/Swagger definition
api_url = f"{SUPABASE_URL}/rest/v1/"
headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

print(f"Fetching schema from: {api_url}")

try:
    response = requests.get(api_url, headers=headers)
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        schema = response.json()

        # Check definitions
        definitions = schema.get("definitions", {})
        patient_records = definitions.get("patient_records", {})
        properties = patient_records.get("properties", {})

        print(f"Found Table: {'patient_records' in definitions}")
        if "patient_records" in definitions:
            print("Checking ID column type...")
            id_col = properties.get("id", {})
            print(f"ID Column Definition: {id_col}")

            print("-" * 20)
    else:
        print("Failed to fetch schema.")
        print(response.text[:500])

except Exception as e:
    print(f"Error: {e}")
