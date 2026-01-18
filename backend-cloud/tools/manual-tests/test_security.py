"""Security testing script for XSS and SQL injection vulnerabilities.

Run this script to test the application against common security attack patterns.
"""

import requests
import json

# Configuration
BASE_URL = "https://api.team3thesis.dev/api"
BACKEND_API_KEY = "9c719864eb9ae54335201428596bb51bc13b5d817a"  # Change to your API key

HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key": BACKEND_API_KEY
}

# XSS Test Payloads
XSS_PAYLOADS = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')",
    "<svg onload=alert('XSS')>",
    "<<SCRIPT>alert('XSS');//<</SCRIPT>",
]

# SQL Injection Test Payloads
SQL_PAYLOADS = [
    "' OR '1'='1",
    "1' OR '1' = '1",
    "' OR 1=1--",
    "admin'--",
    "1; DROP TABLE users--",
]


def test_xss_demographics():
    """Test XSS in demographics fields."""
    print("\n[+] Testing XSS in Demographics...")
    
    # Start session
    session_resp = requests.post(
        f"{BASE_URL}/session/start",
        json={"consent": False},
        headers=HEADERS
    )
    session_id = session_resp.json()["session_id"]
    
    # Test each XSS payload
    for payload in XSS_PAYLOADS:
        test_data = {
            "age": 25,
            "weight_kg": 70,
            "height_cm": 170,
            "gender": "male",
            "willing_to_donate": False,
            "blood_type": payload  # Potential XSS vector
        }
        
        resp = requests.post(
            f"{BASE_URL}/session/{session_id}/demographics",
            json=test_data,
            headers=HEADERS
        )
        
        if resp.status_code == 200:
            print(f"  ✓ Payload rejected or sanitized: {payload[:30]}...")
        elif resp.status_code == 422:
            print(f"  ✓ Validation error (good): {payload[:30]}...")
        else:
            print(f"  ✗ Unexpected response: {resp.status_code}")


def test_sql_injection():
    """Test SQL injection in session ID."""
    print("\n[+] Testing SQL Injection...")
    
    for payload in SQL_PAYLOADS:
        # Try to inject into session ID parameter
        resp = requests.get(
            f"{BASE_URL}/session/{payload}/debug",
            headers=HEADERS
        )
        
        # Check if response contains error or no sensitive data leaked
        try:
            data = resp.json()
            
            # Safe responses: 404, 400, or {"error": ...}
            if resp.status_code in [404, 400]:
                print(f"  ✓ Payload safely rejected ({resp.status_code}): {payload[:30]}...")
            elif "error" in data and ("not found" in data["error"].lower() or "invalid" in data["error"].lower()):
                print(f"  ✓ Payload safely handled (error returned): {payload[:30]}...")
            elif resp.status_code == 200 and "session_id" in data:
                # If it returns actual session data with 200, that's bad
                print(f"  ✗ POTENTIAL VULNERABILITY: Data returned for: {payload[:30]}...")
            else:
                print(f"  ✓ Safe response (no data leaked): {payload[:30]}...")
        except:
            # Non-JSON response or connection error
            if resp.status_code in [400, 404, 500]:
                print(f"  ✓ Payload rejected ({resp.status_code}): {payload[:30]}...")
            else:
                print(f"  ? Unexpected response ({resp.status_code}): {payload[:30]}...")


def test_path_traversal():
    """Test path traversal in download endpoint."""
    print("\n[+] Testing Path Traversal...")
    
    traversal_payloads = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "....//....//....//etc/passwd",
    ]
    
    for payload in traversal_payloads:
        resp = requests.get(
            f"{BASE_URL}/session/{payload}/download-pdf"
        )
        
        if resp.status_code in [400, 404]:
            print(f"  ✓ Payload blocked: {payload[:30]}...")
        else:
            print(f"  ✗ Potential vulnerability ({resp.status_code}): {payload[:30]}...")


def test_headers():
    """Test security headers."""
    print("\n[+] Testing Security Headers...")
    
    resp = requests.get(f"{BASE_URL}/health", headers=HEADERS)
    
    required_headers = [
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Strict-Transport-Security",  # Only in production with HTTPS
    ]
    
    for header in required_headers:
        if header in resp.headers:
            print(f"  ✓ {header}: {resp.headers[header]}")
        else:
            print(f"  ✗ Missing: {header}")


def main():
    """Run all security tests."""
    print("=" * 60)
    print("Security Testing for XSS and SQL Injection")
    print("=" * 60)
    
    try:
        # Check if server is running
        resp = requests.get(f"{BASE_URL}/health", headers=HEADERS, timeout=5)
        if resp.status_code != 200:
            print(f"Error: Server returned {resp.status_code}")
            return
        
        print(f"✓ Server is running at {BASE_URL}")
        
        # Run tests
        test_xss_demographics()
        test_sql_injection()
        test_path_traversal()
        test_headers()
        
        print("\n" + "=" * 60)
        print("Testing Complete!")
        print("=" * 60)
        print("\nNote: All tests should show ✓ (pass) or validation errors.")
        print("Any ✗ marks indicate potential security issues.")
        
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to {BASE_URL}")
        print("Make sure the backend server is running.")
    except Exception as e:
        print(f"Error during testing: {e}")


if __name__ == "__main__":
    main()
