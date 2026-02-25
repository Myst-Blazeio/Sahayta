
import sys
import os

# Add parent directory to path to allow importing from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import get_db
from flask import Flask
from dotenv import load_dotenv
import os
from config import config

load_dotenv()
app = Flask(__name__)
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])

from db import init_db
init_db(app)

with app.app_context():
    db = get_db()
    print(f"Checking indexes for 'users' collection:")
    indexes = db.users.list_indexes()
    for index in indexes:
        print(index)
    
    print(f"\nChecking indexes for 'police' collection:")
    indexes = db.police.list_indexes()
    for index in indexes:
        print(index)
