
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from db import get_db
from datetime import datetime
from deep_translator import GoogleTranslator
from ml_service import ml_service
import uuid
import pandas as pd
from bson import ObjectId
from werkzeug.security import generate_password_hash

fir_bp = Blueprint('fir', __name__)

@fir_bp.route('/', methods=['POST'])
@jwt_required()
def submit_fir():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'citizen')
    
    data = request.json
    
    original_text = data.get('text')
    language = data.get('language', 'en')
    
    # New Fields
    incident_time = data.get('incident_time')
    location = data.get('location')
    station_id = data.get('station_id')
    
    # Handle Date
    incident_date = data.get('incident_date')
    
    if not original_text:
        return jsonify({'error': 'FIR description is required'}), 400
        
    # Translation
    translated_text = original_text
    if language != 'en':
        try:
            # Note: GoogleTranslator might block if used too heavily.
            translated_text = GoogleTranslator(source='auto', target='en').translate(original_text)
        except Exception as e:
            print(f"Translation failed: {e}")
            pass
            
    # Prepare FIR Entry
    fir_id = str(uuid.uuid4())
    current_time = datetime.utcnow()
    
    # ML Prediction for BNS Sections
    ai_suggestions = []
    try:
        if translated_text:
            ai_suggestions = ml_service.predict_bns(translated_text, k=5)
    except Exception as e:
        print(f"ML Prediction failed in fir_routes: {e}")

    fir_entry = {
        '_id': fir_id,
        'user_id': user_id,
        'original_text': original_text,
        'translated_text': translated_text,
        'language': language,
        'incident_date': incident_date,
        'incident_time': incident_time,
        'location': location,
        'station_id': str(station_id) if station_id else None,
        'status': 'pending',
        'submission_date': current_time,
        'last_updated': current_time,
        'ai_suggestions': ai_suggestions
    }
    
    db = get_db()
    
    if role == 'police':
        # Manual Entry by Police - Fetch their current station ID dynamically
        police_officer = db.police.find_one({'_id': ObjectId(user_id)})
        police_station_id = None
        if police_officer and police_officer.get('station_id'):
            police_station_id = str(police_officer['station_id'])
        else:
            police_station_id = str(claims.get('station_id'))
        
        fir_entry['station_id'] = police_station_id
        
        # Complainant Onboarding / Linking
        comp_username = data.get('complainant_username')
        comp_password = data.get('complainant_password')
        
        citizen_user_id = None
        
        if comp_username:
            try:
                # Check if user already exists
                existing_user = db.users.find_one({'username': comp_username})
                if existing_user:
                    citizen_user_id = str(existing_user['_id'])
                    print(f"DEBUG: Linked manual FIR to existing citizen {comp_username}")
                else:
                    # Create new citizen user
                    new_citizen = {
                        'username': comp_username,
                        'password_hash': generate_password_hash(comp_password) if comp_password else generate_password_hash('password123'),
                        'full_name': data.get('complainant_name', 'Unknown'),
                        'aadhar': data.get('complainant_aadhar', 'N/A'),
                        'phone': data.get('complainant_phone', 'N/A'),
                        'email': data.get('complainant_email', 'N/A'),
                        'role': 'citizen',
                        'created_at': datetime.utcnow()
                    }
                    result = db.users.insert_one(new_citizen)
                    citizen_user_id = str(result.inserted_id)
                    print(f"DEBUG: Created new citizen account {comp_username}. Object: {new_citizen}")
            except Exception as e:
                print(f"CRITICAL: Failed to create/link citizen account: {e}")
                # We can choose to continue or abort. If we abort, the user knows registration failed.
                return jsonify({'error': f'Citizen account creation failed: {str(e)}'}), 500
        
        # Associate FIR with the citizen (so they see it)
        if citizen_user_id:
            fir_entry['user_id'] = citizen_user_id
        
        fir_entry['complainant_name'] = data.get('complainant_name', 'Unknown')
        fir_entry['complainant_phone'] = data.get('complainant_phone', 'N/A')
        fir_entry['complainant_aadhar'] = data.get('complainant_aadhar', 'N/A')
        fir_entry['complainant_email'] = data.get('complainant_email', 'N/A')
        fir_entry['source'] = 'police_manual'
        fir_entry['received_by'] = str(user_id)
        print(f"DEBUG: Manual FIR received by officer {user_id} for citizen {citizen_user_id}")
    else:
        # Citizen Entry - Fetch details
        user = db.users.find_one({'_id': ObjectId(user_id)})
        fir_entry['complainant_name'] = user.get('full_name', 'Unknown') if user else 'Unknown'
        fir_entry['complainant_phone'] = user.get('phone', 'N/A') if user else 'N/A'
        fir_entry['complainant_aadhar'] = user.get('aadhar', 'N/A') if user else 'N/A'
        fir_entry['complainant_email'] = user.get('email', 'N/A') if user else 'N/A'
        fir_entry['source'] = 'citizen_portal'
        # Note: Citizen entries don't have a station_id yet, which is expected.
        # They get assigned one later or it's handled by some other logic.

    db.firs.insert_one(fir_entry)
    return jsonify({'message': 'FIR submitted successfully', 'fir_id': fir_id}), 201

@fir_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_firs():
    user_id = get_jwt_identity()
    db = get_db()
    if db is not None:
        # Fetch from active firs
        active_firs = list(db.firs.find({'user_id': user_id}))
        # Fetch from archives
        archived_firs = list(db.archives.find({'user_id': user_id}))
        
        all_firs = active_firs + archived_firs
        
        for fir in all_firs:
            fir['_id'] = str(fir['_id'])
            if 'submission_date' in fir:
                 fir['submission_date'] = fir['submission_date'].isoformat()
            if 'last_updated' in fir and isinstance(fir['last_updated'], datetime):
                 fir['last_updated'] = fir['last_updated'].isoformat()
                 
        # Sort by submission date desc
        all_firs.sort(key=lambda x: x.get('submission_date', ''), reverse=True)
                 
        return jsonify(all_firs), 200
    return jsonify([]), 200

@fir_bp.route('/archives', methods=['GET'])
@jwt_required()
def get_archived_firs():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'citizen')
    
    db = get_db()
    if db is not None:
        query = {}
        # If citizen, only show their own archives
        if role == 'citizen':
            query['user_id'] = user_id
        # If police, show all archives (or filter by station if implemented)
        
        archives = list(db.archives.find(query).sort('submission_date', -1))
        
        for fir in archives:
            fir['_id'] = str(fir['_id'])
            if 'submission_date' in fir and isinstance(fir['submission_date'], datetime):
                 fir['submission_date'] = fir['submission_date'].isoformat()
            if 'last_updated' in fir and isinstance(fir['last_updated'], datetime):
                 fir['last_updated'] = fir['last_updated'].isoformat()
                 
        return jsonify(archives), 200
    return jsonify([]), 500

# Police Endpoints

@fir_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_firs():
    claims = get_jwt()
    # Check if user is police
    if claims.get('role') != 'police':
        return jsonify({'error': 'Unauthorized'}), 403
        
    station_id = claims.get('station_id')
    # If a station_id is assigned, filter by it. If not, maybe show all (or none). 
    # For now, let's assume filtering if present.
    
    query = {'status': {'$in': ['pending', 'in_progress']}}
    if station_id:
        query['station_id'] = station_id
        
    db = get_db()
    if db is not None:
        # Fetch pending or in-progress
        firs = list(db.firs.find(query))
        for fir in firs:
            fir['_id'] = str(fir['_id'])
            if 'submission_date' in fir:
                 fir['submission_date'] = fir['submission_date'].isoformat()
        return jsonify(firs), 200
    return jsonify([]), 500

@fir_bp.route('/<fir_id>', methods=['GET'])
@jwt_required()
def get_fir_details(fir_id):
    # Allow police or the specific user
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'citizen')
    
    db = get_db()
    if db is None:
        return jsonify({'error': 'Database error'}), 500
        
    fir = db.firs.find_one({'_id': fir_id})
    if not fir:
        # Check archives
        fir = db.archives.find_one({'_id': fir_id})
        
    if not fir:
        return jsonify({'error': 'FIR not found'}), 404
        
    # access control
    if role != 'police' and fir['user_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    fir['_id'] = str(fir['_id'])
    if 'submission_date' in fir and isinstance(fir['submission_date'], datetime):
         fir['submission_date'] = fir['submission_date'].isoformat()
    if 'last_updated' in fir and isinstance(fir['last_updated'], datetime):
         fir['last_updated'] = fir['last_updated'].isoformat()
         
    # Check for missing complainant details and fetch from user if possible
    if fir.get('source') == 'citizen_portal' and (
        not fir.get('complainant_email') or fir.get('complainant_email') == 'N/A' or
        not fir.get('complainant_phone') or fir.get('complainant_phone') == 'N/A'
    ):
        try:
            user_record = db.users.find_one({'_id': ObjectId(fir['user_id'])})
            if user_record:
                if not fir.get('complainant_email') or fir['complainant_email'] == 'N/A':
                    fir['complainant_email'] = user_record.get('email', 'N/A')
                if not fir.get('complainant_phone') or fir['complainant_phone'] == 'N/A':
                    fir['complainant_phone'] = user_record.get('phone', 'N/A')
                if not fir.get('complainant_aadhar') or fir['complainant_aadhar'] == 'N/A':
                    fir['complainant_aadhar'] = user_record.get('aadhar', 'N/A')
                if not fir.get('complainant_name') or fir['complainant_name'] == 'Unknown':
                    fir['complainant_name'] = user_record.get('full_name', 'Unknown')
        except Exception as e:
            print(f"Error fetching user details for FIR {fir_id}: {e}")

    return jsonify(fir), 200

@fir_bp.route('/<fir_id>/update', methods=['PUT'])
@jwt_required()
def update_fir(fir_id):
    # Verify police role here ideally
    data = request.json
    status = data.get('status')
    sections = data.get('applicable_sections', []) # List of strings
    police_notes = data.get('police_notes', '')
    
    if not status:
        return jsonify({'error': 'Status is required'}), 400
        
    db = get_db()
    if db is not None:
        old_fir = db.firs.find_one({'_id': fir_id})
        
        if not old_fir:
             return jsonify({'error': 'FIR not found'}), 404
             
        old_status = old_fir.get('status')
        
        update_data = {
            'status': status,
            'police_notes': police_notes,
            'last_updated': datetime.utcnow()
        }
        
        if sections:
            update_data['applicable_sections'] = sections
            
        if status in ['resolved', 'rejected']:
            # Move to archives
            current_user_id = str(get_jwt_identity())
            if status == 'resolved':
                update_data['resolved_by'] = current_user_id
            else:
                update_data['rejected_by'] = current_user_id
                
            print(f"DEBUG: FIR {fir_id} {status} by officer {current_user_id}")
            archived_fir = old_fir.copy()
            archived_fir.update(update_data)
            
            # Insert into archives
            db.archives.insert_one(archived_fir)
            
            # Remove from firs
            db.firs.delete_one({'_id': fir_id})
            
            # Notify user
            msg = f"Your FIR ({fir_id[:8]}) has been marked as {status.upper()}."
            notification = {
                '_id': str(uuid.uuid4()),
                'user_id': old_fir['user_id'],
                'message': msg,
                'is_read': False,
                'created_at': datetime.utcnow()
            }
            db.notifications.insert_one(notification)
            
            return jsonify({'message': f'FIR {status} and archived'}), 200
            
        else:
            # Normal update (e.g., in_progress)
            result = db.firs.update_one({'_id': fir_id}, {'$set': update_data})
            return jsonify({'message': 'FIR updated successfully'}), 200
            
            if result.matched_count:
                # Create Notification if status changed
                if old_status != status:
                    msg = f"Your FIR ({fir_id[:8]}) status has been updated to '{status.replace('_', ' ').title()}'."
                    notification = {
                        '_id': str(uuid.uuid4()),
                        'user_id': old_fir['user_id'],
                        'message': msg,
                        'is_read': False,
                        'created_at': datetime.utcnow()
                    }
                    db.notifications.insert_one(notification)
                    
                return jsonify({'message': 'FIR updated successfully'}), 200
            else:
                return jsonify({'error': 'FIR not found'}), 404
    return jsonify({'error': 'Database error'}), 500

@fir_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    db = get_db()
    if db is not None:
        notifs = list(db.notifications.find({'user_id': user_id}).sort('created_at', -1))
        for n in notifs:
            n['_id'] = str(n['_id'])
            if 'created_at' in n:
                n['created_at'] = n['created_at'].isoformat()
        return jsonify(notifs), 200
    return jsonify([]), 500

@fir_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    user_id = get_jwt_identity()
    db = get_db()
    if db is not None:
        db.notifications.update_one(
            {'_id': notification_id, 'user_id': user_id},
            {'$set': {'is_read': True}}
        )
        return jsonify({'message': 'Marked as read'}), 200
    return jsonify({'error': 'Database error'}), 500
@fir_bp.route('/community-alerts', methods=['GET'])
@jwt_required()
def get_community_alerts():
    db = get_db()
    if db is not None:
        # Fetch latest 10 community alerts
        alerts = list(db.community_alerts.find().sort('created_at', -1).limit(10))
        for alert in alerts:
            alert['_id'] = str(alert['_id'])
            if 'created_at' in alert:
                alert['created_at'] = alert['created_at'].isoformat()
        return jsonify(alerts), 200
    return jsonify([]), 200
