from app import app
from db import get_db
from werkzeug.security import generate_password_hash
import traceback

print("Starting tests...")
with app.app_context():
    db = get_db()
    if not db.police.find_one({'username': 'test_admin'}):
        db.police.insert_one({
            'username': 'test_admin', 
            'password_hash': generate_password_hash('password'), 
            'role': 'police',
            'full_name': 'Test Admin',
            'station_id': 'ST-001'
        })

with app.test_client() as client:
    res = client.post('/police/login', data={'username': 'test_admin', 'password': 'password'})
    print("Login code:", res.status_code)
    
    routes = ['/police/inbox', '/police/analytics', '/police/archives', '/police/alerts', '/police/profile', '/police/stats']
    for route in routes:
        print(f"Testing {route}...")
        try:
            res_route = client.get(route)
            print(f"{route} status: {res_route.status_code}")
            if res_route.status_code == 500:
                print(res_route.data.decode('utf-8')[:1000])
        except Exception as e:
            print(f"Exception on {route}: {e}")
            traceback.print_exc()

print("Tests done.")
