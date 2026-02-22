
from app import app

print("Registered Routes:")
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint}: {rule.methods} {rule.rule}")
