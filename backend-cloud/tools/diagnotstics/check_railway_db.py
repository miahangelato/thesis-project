"""Check Railway PostgreSQL database for saved records."""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Get DATABASE_URL from environment
database_url = os.getenv("DATABASE_URL")

if not database_url:
    print("❌ DATABASE_URL not found in environment!")
    print("Make sure you have a .env file with DATABASE_URL")
    exit(1)

print("=" * 60)
print("RAILWAY DATABASE CHECK")
print("=" * 60)

try:
    # Connect to PostgreSQL
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    print("✅ Connected to Railway PostgreSQL")
    
    # Check if patient_records table exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'patient_records'
        );
    """)
    table_exists = cursor.fetchone()[0]
    
    if not table_exists:
        print("❌ patient_records table does not exist!")
        print("\nYou may need to run migrations:")
        print("  python manage.py makemigrations")
        print("  python manage.py migrate")
        conn.close()
        exit(1)
    
    print("✅ patient_records table exists")
    
    # Get total count
    cursor.execute("SELECT COUNT(*) FROM patient_records;")
    total = cursor.fetchone()[0]
    print(f"\nTotal records in database: {total}")
    
    if total == 0:
        print("\n⚠️  No records found. This could mean:")
        print("  1. No one has completed a scan with consent=True yet")
        print("  2. All scans were done without consent")
        print("  3. There was an error saving records")
    else:
        print("\n" + "=" * 60)
        print("RECENT RECORDS (Last 5)")
        print("=" * 60)
        
        # Get recent records
        cursor.execute("""
            SELECT 
                id, 
                age, 
                weight_kg,
                height_cm,
                bmi,
                risk_level, 
                risk_score,
                blood_group,
                pattern_arc,
                pattern_whorl,
                pattern_loop,
                created_at
            FROM patient_records 
            ORDER BY created_at DESC 
            LIMIT 5;
        """)
        
        records = cursor.fetchall()
        
        for record in records:
            print(f"\nRecord ID: {record[0]}")
            print(f"  Created: {record[11]}")
            print(f"  Age: {record[1]}, BMI: {record[4]}")
            print(f"  Risk: {record[5]} ({record[6]:.2%})")
            print(f"  Blood Group: {record[7] or 'N/A'}")
            print(f"  Patterns - Arc: {record[8]}, Whorl: {record[9]}, Loop: {record[10]}")
    
    cursor.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"❌ Database error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
