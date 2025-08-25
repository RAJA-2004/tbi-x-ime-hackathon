#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from utils.auth import get_password_hash
import json

# Generate demo user hash
demo_password_hash = get_password_hash('demo123')
print(f"Demo password hash: {demo_password_hash}")

# Read current users
try:
    with open('users_db.json', 'r') as f:
        users = json.load(f)
except:
    users = {}

# Add demo user
demo_user = {
    "username": "demo",
    "email": "demo@sof-extractor.com",
    "hashed_password": demo_password_hash
}

users["demo@sof-extractor.com"] = demo_user

# Save updated users
with open('users_db.json', 'w') as f:
    json.dump(users, f, indent=2)

print("Demo user created successfully!")
print("Email: demo@sof-extractor.com")
print("Password: demo123")
