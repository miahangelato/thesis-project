"""Check Supabase database for saved patient records."""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Get Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("❌ SUPABASE_URL or SUPABASE_KEY not found!")
    print("Make sure your .env file has these variables")
    exit(1)

print("=" * 60)
print("SUPABASE DATABASE CHECK")
print("=" * 60)

try:
    # Connect to Supabase
    supabase: Client = create_client(supabase_url, supabase_key)
    print("✅ Connected to Supabase")
    
    # Check if table exists and get records
    response = supabase.table('patient_records').select('*').order('created_at', desc=True).limit(10).execute()
    
    total = len(response.data)
    
    print(f"\n📊 Found {total} recent records")
    
    if total == 0:
        print("\n⚠️  No records found in patient_records table")
        print("\nPossible reasons:")
        print("  1. No scans completed with consent=True")
        print("  2. Table doesn't exist yet - run migrations:")
        print("     python manage.py migrate")
        print("  3. Records are being saved to a different database")
    else:
        print("\n" + "=" * 60)
        print(f"RECENT RECORDS (Showing {total})")
        print("=" * 60)
        
        for i, record in enumerate(response.data, 1):
            print(f"\n[{i}] Record ID: {record.get('id')}")
            print(f"    Created: {record.get('created_at')}")
            print(f"    Age: {record.get('age')}, BMI: {record.get('bmi')}")
            print(f"    Risk: {record.get('risk_level')} ({record.get('risk_score'):.2%})")
            print(f"    Blood Group: {record.get('blood_group') or 'N/A'}")
            print(f"    Patterns - Arc: {record.get('pattern_arc')}, Whorl: {record.get('pattern_whorl')}, Loop: {record.get('pattern_loop')}")
            
            if i >= 5:
                print(f"\n... and {total - 5} more record(s)")
                break
    
    print("\n✅ Done!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    
    print("\n💡 Tip: Check your Supabase dashboard at:")
    print(f"   {supabase_url}/project/default/editor")
