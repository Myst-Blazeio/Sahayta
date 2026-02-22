
import os
import sys
from app import app
from db import get_db
from bson import ObjectId

print("--- ROUTE DIAGNOSTICS ---")
found_delete = False
found_dismiss = False
for rule in app.url_map.iter_rules():
    if '/police/alerts/<alert_id>' in str(rule) and 'DELETE' in rule.methods:
        print(f"MATCH: {rule.endpoint} -> {rule.rule} [{rule.methods}]")
        found_delete = True
    if '/api/fir/community-alerts/<alert_id>/dismiss' in str(rule) and 'PUT' in rule.methods:
        print(f"MATCH: {rule.endpoint} -> {rule.rule} [{rule.methods}]")
        found_dismiss = True

if not found_delete:
    print("WARNING: Police delete alert route NOT FOUND!")
if not found_dismiss:
    print("WARNING: Citizen dismiss alert route NOT FOUND!")

print("\n--- DATABASE DIAGNOSTICS ---")
with app.app_context():
    db = get_db()
    alerts = list(db.community_alerts.find().limit(5))
    print(f"Found {len(alerts)} alerts in community_alerts collection.")
    for a in alerts:
        print(f"ID: {a['_id']} (Type: {type(a['_id']).__name__})")
    
    users = list(db.users.find().limit(1))
    if users:
        u = users[0]
        print(f"Sample User ID: {u['_id']} (Type: {type(u['_id']).__name__})")
        print(f"Dismissed Alerts: {u.get('dismissed_alerts', [])}")
