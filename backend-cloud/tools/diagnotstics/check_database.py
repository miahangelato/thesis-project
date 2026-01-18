"""Quick script to check database connectivity and recent sessions."""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import PatientRecord
from django.db import connection

print("=" * 60)
print("DATABASE CONNECTION CHECK")
print("=" * 60)

# Test database connection
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        print("✅ Database connection: SUCCESS")
except Exception as e:
    print(f"❌ Database connection: FAILED - {e}")
    exit(1)

# Check if tables exist
try:
    record_count = PatientRecord.objects.count()
    print(f"✅ PatientRecord table exists: {record_count} total records")
except Exception as e:
    print(f"❌ PatientRecord table check failed: {e}")
    exit(1)

print("\n" + "=" * 60)
print("RECENT RECORDS (Last 5)")
print("=" * 60)

try:
    recent_records = PatientRecord.objects.order_by('-created_at')[:5]
    
    if recent_records:
        for record in recent_records:
            print(f"\nRecord ID: {record.id}")
            print(f"  Created: {record.created_at}")
            print(f"  Age: {record.age}")
            print(f"  BMI: {record.bmi}")
            print(f"  Risk: {record.risk_level} ({record.risk_score:.2%})")
            
            # Pattern counts
            print(f"  Patterns - Arc: {record.pattern_arc}, Whorl: {record.pattern_whorl}, Loop: {record.pattern_loop}")
            
            # Blood group
            if record.blood_group:
                print(f"  Blood Group: {record.blood_group}")
                print(f"  Donation Status: {record.donation_eligibility_status or 'N/A'}")
    else:
        print("No records found in database.")
        
except Exception as e:
    print(f"❌ Error querying records: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("DATABASE INFO")
print("=" * 60)

# Show database name
db_name = connection.settings_dict.get('NAME', 'Unknown')
db_host = connection.settings_dict.get('HOST', 'localhost')
print(f"Database: {db_name}")
print(f"Host: {db_host}")
print(f"Engine: {connection.settings_dict.get('ENGINE', 'Unknown')}")
