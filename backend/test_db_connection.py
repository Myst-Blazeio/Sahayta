
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import sys

# Add backend directory to path if needed, though this script is standalone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

uri = os.environ.get('MONGO_URI')
print(f"Testing connection to: {uri.split('@')[1] if '@' in uri else '...'} ...")

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.server_info() # Trigger connection
    print("SUCCESS: Connected to MongoDB!")
    db = client.get_database()
    print(f"Database: {db.name}")
    print("Collections:", db.list_collection_names())
except Exception as e:
    print(f"FAILURE: Could not connect to MongoDB.\nError: {e}")
