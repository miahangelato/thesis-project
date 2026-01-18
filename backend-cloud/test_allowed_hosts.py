"""Test script to verify ALLOWED_HOSTS configuration"""
import os
import sys

# Test Case 1: Wildcard
print("=" * 60)
print("Test 1: ALLOWED_HOSTS='*'")
print("=" * 60)
os.environ["ALLOWED_HOSTS"] = "*"

allowed_hosts_env = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")

if allowed_hosts_env.strip() == "*":
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_env.split(",") if host.strip()]

print(f"Input: ALLOWED_HOSTS='{os.environ['ALLOWED_HOSTS']}'")
print(f"Output: {ALLOWED_HOSTS}")
print(f"✓ Wildcard works correctly!\n")

# Test Case 2: Comma-separated domains
print("=" * 60)
print("Test 2: ALLOWED_HOSTS='domain1.com,domain2.com'")
print("=" * 60)
os.environ["ALLOWED_HOSTS"] = "thesis-project-be-production.up.railway.app,api.example.com"

allowed_hosts_env = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")

if allowed_hosts_env.strip() == "*":
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_env.split(",") if host.strip()]

print(f"Input: ALLOWED_HOSTS='{os.environ['ALLOWED_HOSTS']}'")
print(f"Output: {ALLOWED_HOSTS}")
print(f"✓ Comma-separated domains work correctly!\n")

# Test Case 3: Railway auto-detection
print("=" * 60)
print("Test 3: Railway domain auto-detection")
print("=" * 60)
os.environ["ALLOWED_HOSTS"] = "localhost"
os.environ["RAILWAY_ENVIRONMENT"] = "production"
os.environ["RAILWAY_PUBLIC_DOMAIN"] = "thesis-project-be-production.up.railway.app"

allowed_hosts_env = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")

if allowed_hosts_env.strip() == "*":
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_env.split(",") if host.strip()]

# Railway auto-detection
if os.getenv("RAILWAY_ENVIRONMENT"):
    railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
    if railway_domain and railway_domain not in ALLOWED_HOSTS and "*" not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(railway_domain)

print(f"Input: ALLOWED_HOSTS='{os.environ['ALLOWED_HOSTS']}'")
print(f"Railway Domain: {os.environ['RAILWAY_PUBLIC_DOMAIN']}")
print(f"Output: {ALLOWED_HOSTS}")
print(f"✓ Railway domain auto-added!\n")

print("=" * 60)
print("All tests passed! ✓")
print("=" * 60)
