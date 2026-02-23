from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from db import get_db
import datetime
from bson import ObjectId

police_bp = Blueprint('police', __name__)

@police_bp.route('/dashboard')
@jwt_required()
def dashboard():
    current_user_id = get_jwt_identity()
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Fetch Stats
    # Total Pending FIRs for this station
    pending_firs_count = db.firs.count_documents({'station_id': user.get('station_id'), 'status': 'pending'})
    
    # Recent FIRs (ONLY PENDING for dashboard as requested)
    recent_firs_cursor = db.firs.find({'station_id': user.get('station_id'), 'status': 'pending'}).sort('submission_date', -1).limit(5)
    recent_firs = []
    for fir in recent_firs_cursor:
        fir['_id'] = str(fir['_id'])
        recent_firs.append(fir)
    
    # Chart Data: Group by Month (Last 6 Months) from both active and archived FIRs
    pipeline = [
        {
            '$match': {
                'station_id': user.get('station_id'),
                'submission_date': {'$gte': datetime.datetime.utcnow() - datetime.timedelta(days=180)}
            }
        },
        {
            '$unionWith': {
                'coll': 'archives',
                'pipeline': [
                    {
                        '$match': {
                            'station_id': user.get('station_id'),
                            'submission_date': {'$gte': datetime.datetime.utcnow() - datetime.timedelta(days=180)}
                        }
                    }
                ]
            }
        },
        {
            '$group': {
                '_id': {'$month': '$submission_date'},
                'count': {'$sum': 1}
            }
        },
        {'$sort': {'_id': 1}}
    ]
    
    monthly_stats = list(db.firs.aggregate(pipeline))
    
    # Format for Chart.js
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    chart_labels = []
    chart_data = []
    
    # Create a map of existing data
    stats_map = {item['_id']: item['count'] for item in monthly_stats}
    
    # Get last 6 months list
    today = datetime.datetime.today()
    for i in range(5, -1, -1):
        d = today - datetime.timedelta(days=i*30)
        m_idx = d.month 
        chart_labels.append(months[m_idx-1])
        chart_data.append(stats_map.get(m_idx, 0))
        
    return jsonify({
        'pending_count': pending_firs_count,
        'recent_firs': recent_firs,
        'chart_labels': chart_labels,
        'chart_data': chart_data
    }), 200

@police_bp.route('/inbox')
@jwt_required()
def inbox():
    current_user_id = get_jwt_identity()
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Fetch only active FIRs for station (Pending & In Progress)
    firs_cursor = db.firs.find({
        'station_id': user.get('station_id'),
        'status': {'$in': ['pending', 'in_progress']}
    }).sort('submission_date', -1)
    
    firs = []
    for fir in firs_cursor:
        fir['_id'] = str(fir['_id'])
        firs.append(fir)
    
    return jsonify(firs), 200

@police_bp.route('/archives')
@jwt_required()
def archives():
    current_user_id = get_jwt_identity()
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Fetch archived FIRs
    archived_firs_cursor = db.archives.find({'station_id': user.get('station_id')}).sort('submission_date', -1)
    
    archived_firs = []
    for fir in archived_firs_cursor:
        fir['_id'] = str(fir['_id'])
        archived_firs.append(fir)
    
    return jsonify(archived_firs), 200

@police_bp.route('/analytics')
@jwt_required()
def analytics():
    current_user_id = get_jwt_identity()
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Real Analytics Data
    total_firs = db.firs.count_documents({'station_id': user.get('station_id')})
    archived_count = db.archives.count_documents({'station_id': user.get('station_id')})
    
    resolved_firs = db.archives.count_documents({'station_id': user.get('station_id'), 'status': 'resolved'})
    pending_firs = db.firs.count_documents({'station_id': user.get('station_id'), 'status': 'pending'})
    rejected_firs = db.archives.count_documents({'station_id': user.get('station_id'), 'status': 'rejected'})
    rejected_active = db.firs.count_documents({'station_id': user.get('station_id'), 'status': 'rejected'})
    
    stats = {
        'total': total_firs + archived_count,
        'resolved': resolved_firs,
        'pending': pending_firs,
        'rejected': rejected_firs + rejected_active
    }
    
    return jsonify(stats), 200

@police_bp.route('/profile', methods=['GET', 'POST'])
@jwt_required()
def profile():
    current_user_id = get_jwt_identity()
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if request.method == 'POST':
        data = request.get_json()
        full_name = data.get('full_name')
        
        update_data = {
            'full_name': full_name
        }
        
        db.police.update_one({'_id': ObjectId(current_user_id)}, {'$set': update_data})
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    user['_id'] = str(user['_id'])
    user.pop('password_hash', None)
    return jsonify(user), 200

@police_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_officer_stats():
    current_user_id = str(get_jwt_identity())
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    received_count = db.firs.count_documents({'received_by': current_user_id})
    archived_received = db.archives.count_documents({'received_by': current_user_id})
    resolved_count = db.archives.count_documents({'resolved_by': current_user_id})
    
    return jsonify({
        'full_name': user.get('full_name'),
        'email': user.get('email', 'N/A'),
        'phone': user.get('phone', 'N/A'),
        'received_count': received_count + archived_received,
        'resolved_count': resolved_count
    })


@police_bp.route('/alerts', methods=['GET'])
@jwt_required()
def alerts():
    current_user_id = str(get_jwt_identity())
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Fetch all sent alerts
    all_alerts = list(db.community_alerts.find().sort('created_at', -1))
    for alert in all_alerts:
        alert['_id'] = str(alert['_id'])
    
    return jsonify(all_alerts), 200

@police_bp.route('/alerts', methods=['POST'])
@jwt_required()
def create_alert():
    current_user_id = str(get_jwt_identity())
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing JSON paylaod'}), 400

    type_val = data.get('type', 'advisory') # crime, safety, emergency, advisory, update
    title = data.get('title')
    message = data.get('message')
    
    # Map 'type' to 'severity' for the frontend compatibility (citizen portal uses both)
    intensity_map = {
        'emergency': 'critical',
        'crime': 'high',
        'safety': 'medium', 
        'advisory': 'low',
        'update': 'low'
    }
    severity = data.get('severity') or intensity_map.get(type_val, 'low')
    
    if not title or not message:
        return jsonify({'error': 'Title and message are required'}), 400
        
    import uuid
    alert_id = str(uuid.uuid4())
    new_alert = {
        '_id': alert_id,
        'title': title,
        'type': type_val,
        'message': message,
        'severity': severity,
        'created_by': current_user_id,
        'station_id': user.get('station_id'),
        'created_at': datetime.datetime.utcnow(),
        'is_active': True
    }
    
    db.community_alerts.insert_one(new_alert)
    
    # Send a notification to EVERY registered citizen
    citizens = db.users.find({'role': 'citizen'})
    notifications = []
    for citizen in citizens:
        notifications.append({
            '_id': str(uuid.uuid4()),
            'user_id': str(citizen['_id']),
            'message': f"EMERGENCY ALERT: {title} - {message}",
            'is_read': False,
            'type': 'community_alert',
            'alert_id': alert_id,
            'created_at': datetime.datetime.utcnow()
        })
    
    if notifications:
        db.notifications.insert_many(notifications)
    
    print(f"DEBUG: Community Alert '{title}' broadcasted to all citizens.")
    
    return jsonify({'message': 'Alert broadcasted successfully', 'alert': new_alert}), 201

@police_bp.route('/alerts/<alert_id>', methods=['DELETE'])
@jwt_required()
def delete_alert(alert_id):
    current_user_id = str(get_jwt_identity())
    db = get_db()
    
    # Check if user exists and is authorized (police)
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    # Delete the alert (handle both string and ObjectId)
    query = {'_id': alert_id}
    try:
        if len(alert_id) == 24:
            query = {'$or': [{'_id': alert_id}, {'_id': ObjectId(alert_id)}]}
    except:
        pass

    result = db.community_alerts.delete_one(query)
    
    if result.deleted_count:
        # Also delete related notifications for this alert
        db.notifications.delete_many({'alert_id': alert_id})
        return jsonify({'message': 'Alert and related notifications deleted successfully'}), 200
    else:
        return jsonify({'error': 'Alert not found'}), 404
