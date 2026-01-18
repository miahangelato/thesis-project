"""Check for the latest record"""

import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from api.encryption import get_encryption_manager
from storage import get_storage

storage = get_storage()
encryption = get_encryption_manager()

# Get all records
response = (
    storage.client.table("patient_records")
    .select("*")
    .order("created_at", desc=True)
    .limit(5)
    .execute()
)

print(f"✅ Found {len(response.data)} records (showing latest 5):\n")

for record in response.data:
    print(f"==== Record ID: {record['id']} ====")
    print(f"  Created: {record['created_at']}")
    print(f"  Risk Level: {record['risk_level']}")
    print(f"  Blood Group: {record['blood_group']}")
    print(f"  Public Age: {record['age']} (should be -1)")
    print(f"  Public Gender: {record['gender']} (should be 'Encrypted')")

    # Decrypt
    encrypted_data = record.get("encrypted_data")
    if encrypted_data:
        real_age = encryption.decrypt_value(encrypted_data.get("age"))
        real_gender = encryption.decrypt_value(encrypted_data.get("gender"))
        real_weight = encryption.decrypt_value(encrypted_data.get("weight_kg"))

        print(f"  ✅ DECRYPTED Real Age: {real_age}")
        print(f"  ✅ DECRYPTED Real Gender: {real_gender}")
        print(f"  ✅ DECRYPTED Real Weight: {real_weight}")
    print()
