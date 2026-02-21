import pymongo
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def verify_mongodb():
    """
    Checks if the MongoDB connection is healthy.
    Exits with 0 if successful, 1 otherwise.
    """
    mongo_uri = os.getenv('MONGO_URI')
    if not mongo_uri:
        print("[ERROR] MONGO_URI not found in environment. Check .env file.")
        return False

    try:
        # Use a short timeout for the connection check
        client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        print("[SUCCESS] MongoDB connection verified.")
        return True
    except Exception as e:
        print(f"[ERROR] Could not connect to MongoDB: {e}")
        return False

if __name__ == "__main__":
    if verify_mongodb():
        sys.exit(0)
    else:
        sys.exit(1)
