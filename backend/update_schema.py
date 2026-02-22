from app import app
from db import get_db
from bson.objectid import ObjectId

def run_migration():
    with app.app_context():
        db = get_db()
        print("Starting Database Migration for FIRs and Archives...")
        
        # 1. Update active FIRs (station_id)
        firs = list(db.firs.find({"station_id": {"$in": [None, ""]}}))
        print(f"Found {len(firs)} active FIRs without station_id.")
        for fir in firs:
            received_by = fir.get("received_by")
            if received_by:
                # Try to find the officer to get their station_id
                try:
                    officer = db.police.find_one({"_id": ObjectId(received_by)})
                except:
                    officer = db.police.find_one({"_id": received_by})
                
                if officer and officer.get("station_id"):
                    db.firs.update_one({"_id": fir["_id"]}, {"$set": {"station_id": str(officer["station_id"])}})
                    print(f"Updated active FIR {fir['_id']} with station_id {officer['station_id']}")
        
        # 2. Update Archives (station_id, username, station_name)
        archives = list(db.archives.find({
            "$or": [
                {"station_id": {"$in": [None, ""]}},
                {"username": {"$exists": False}},
                {"station_name": {"$exists": False}}
            ]
        }))
        print(f"Found {len(archives)} archives needing backfill.")
        
        for arch in archives:
            update_fields = {}
            
            # Identify the officer who acted on it
            officer_id = arch.get("resolved_by") or arch.get("rejected_by") or arch.get("received_by")
            officer = None
            if officer_id:
                try:
                    officer = db.police.find_one({"_id": ObjectId(officer_id)})
                except:
                    officer = db.police.find_one({"_id": officer_id})
            
            if officer:
                if not arch.get("station_id") and officer.get("station_id"):
                    update_fields["station_id"] = str(officer["station_id"])
                    
                if not arch.get("username"):
                    update_fields["username"] = str(officer.get("username", "Unknown"))
                    
                if not arch.get("station_name"):
                    # Using station_id as station_name for now if station_name doesn't exist separately
                    update_fields["station_name"] = str(officer.get("station_id", "Unknown"))
            else:
                if not arch.get("username"):
                    update_fields["username"] = "Unknown"
                if not arch.get("station_name"):
                    update_fields["station_name"] = "Unknown"
                    
            if update_fields:
                db.archives.update_one({"_id": arch["_id"]}, {"$set": update_fields})
                print(f"Updated archive {arch['_id']} with {update_fields}")
                
        print("Database Migration Completed.")

if __name__ == "__main__":
    run_migration()
