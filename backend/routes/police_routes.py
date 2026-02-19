from flask import Blueprint, render_template, request, redirect, url_for, flash, make_response, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies
from werkzeug.security import check_password_hash, generate_password_hash
from db import get_db
import datetime
from bson import ObjectId

police_bp = Blueprint('police', __name__)

@police_bp.route('/')
def index():
    # If user is already logged in, redirect to dashboard
    # (Optional, but good UX)
    # verify_jwt_in_request(optional=True)
    # if get_jwt_identity():
    #     return redirect(url_for('police.dashboard'))
    return render_template('police/index.html')

@police_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        db = get_db()
        user = db.police.find_one({'username': username})
        
        if user and check_password_hash(user['password_hash'], password):
            access_token = create_access_token(identity=str(user['_id']), additional_claims={"role": "police", "station_id": user.get('station_id')})
            resp = make_response(redirect(url_for('police.dashboard')))
            set_access_cookies(resp, access_token)
            return resp
        else:
            flash('Invalid credentials or not a police account', 'error')
            
    return render_template('police/login.html')

@police_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        full_name = request.form.get('full_name')
        police_id = request.form.get('police_id')
        station_id = request.form.get('station_id')
        phone = request.form.get('phone')
        email = request.form.get('email')
        
        if password != confirm_password:
             flash('Passwords do not match', 'error')
             return redirect(url_for('police.signup'))
        
        db = get_db()
        
        if db.police.find_one({'username': username}):
            flash('Username already exists', 'error')
            return redirect(url_for('police.signup'))
            
        if db.police.find_one({'police_id': police_id}):
             flash('Police ID already registered', 'error')
             return redirect(url_for('police.signup'))

        # Check phone/email if needed, for now just inserting
        
        new_user = {
            'username': username,
            'full_name': full_name,
            'role': 'police',
            'police_id': str(police_id),
            'station_id': str(station_id),
            'phone': phone,
            'email': email,
            'password_hash': generate_password_hash(password),
            'created_at': datetime.datetime.utcnow()
        }
        
        db.police.insert_one(new_user)
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('police.login'))

    return render_template('police/signup.html')

@police_bp.route('/logout')
def logout():
    resp = make_response(redirect(url_for('police.login')))
    unset_jwt_cookies(resp)
    return resp

@police_bp.route('/dashboard')
@jwt_required()
def dashboard():
    current_user_id = get_jwt_identity()
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return redirect(url_for('police.login'))
        
    # Fetch Stats
    # Total Pending FIRs for this station
    pending_firs_count = db.firs.count_documents({'station_id': user.get('station_id'), 'status': 'pending'})
    
    # Recent FIRs (ONLY PENDING for dashboard as requested)
    recent_firs = list(db.firs.find({'station_id': user.get('station_id'), 'status': 'pending'}).sort('submission_date', -1).limit(5))
    
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
        
    return render_template('police/dashboard.html', 
                           user=user, 
                           pending_count=pending_firs_count, 
                           firs=recent_firs,
                           chart_labels=chart_labels,
                           chart_data=chart_data)

@police_bp.route('/inbox')
@jwt_required()
def inbox():
    current_user_id = get_jwt_identity()
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return redirect(url_for('police.login'))
        
    # Fetch only active FIRs for station (Pending & In Progress)
    firs = list(db.firs.find({
        'station_id': user.get('station_id'),
        'status': {'$in': ['pending', 'in_progress']}
    }).sort('submission_date', -1))
    
    return render_template('police/inbox.html', user=user, firs=firs)

@police_bp.route('/archives')
@jwt_required()
def archives():
    current_user_id = get_jwt_identity()
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return redirect(url_for('police.login'))
        
    # Fetch archived FIRs (Assuming they are in 'archives' collection or 'firs' with specific status)
    # Based on fir_routes.py, resolved/rejected FIRs might be moved to 'archives' collection.
    # Let's check 'archives' collection first.
    archived_firs = list(db.archives.find({'station_id': user.get('station_id')}).sort('submission_date', -1))
    
    return render_template('police/archives.html', user=user, firs=archived_firs)

@police_bp.route('/analytics')
@jwt_required()
def analytics():
    current_user_id = get_jwt_identity()
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return redirect(url_for('police.login'))
        
    # Real Analytics Data
    total_firs = db.firs.count_documents({'station_id': user.get('station_id')})
    # Count from archives as well for total history
    archived_count = db.archives.count_documents({'station_id': user.get('station_id')})
    
    resolved_firs = db.archives.count_documents({'station_id': user.get('station_id'), 'status': 'resolved'})
    pending_firs = db.firs.count_documents({'station_id': user.get('station_id'), 'status': 'pending'})
    rejected_firs = db.archives.count_documents({'station_id': user.get('station_id'), 'status': 'rejected'}) # Assuming rejected also archived
    # If rejected are kept in firs, add check there too.
    rejected_active = db.firs.count_documents({'station_id': user.get('station_id'), 'status': 'rejected'})
    
    stats = {
        'total': total_firs + archived_count,
        'resolved': resolved_firs,
        'pending': pending_firs,
        'rejected': rejected_firs + rejected_active
    }
    
    return render_template('police/analytics.html', user=user, stats=stats)

@police_bp.route('/profile', methods=['GET', 'POST'])
@jwt_required()
def profile():
    current_user_id = get_jwt_identity()
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return redirect(url_for('police.login'))
        
    if request.method == 'POST':
        full_name = request.form.get('full_name')
        phone = request.form.get('phone')
        email = request.form.get('email')
        
        # station_id usually verified/set by admin, but allowing name edit for now
        
        update_data = {
            'full_name': full_name,
            'phone': phone,
            'email': email
        }
        
        db.police.update_one({'_id': ObjectId(current_user_id)}, {'$set': update_data})
        flash('Profile updated successfully', 'success')
        return redirect(url_for('police.profile'))
        
    return render_template('police/profile.html', user=user)

@police_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_officer_stats():
    current_user_id = str(get_jwt_identity())
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        print(f"DEBUG: Stats requested for unknown user ID: {current_user_id}")
        return jsonify({'error': 'User not found'}), 404
        
    received_count = db.firs.count_documents({'received_by': current_user_id})
    archived_received = db.archives.count_documents({'received_by': current_user_id})
    resolved_count = db.archives.count_documents({'resolved_by': current_user_id})
    
    print(f"DEBUG Stats for {user.get('username')}: Received={received_count + archived_received}, Resolved={resolved_count}")
    
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
        return redirect(url_for('police.login'))
        
    # Fetch all sent alerts
    all_alerts = list(db.community_alerts.find().sort('created_at', -1))
    for alert in all_alerts:
        alert['_id'] = str(alert['_id'])
    
    return render_template('police/alerts.html', user=user, alerts=all_alerts)

@police_bp.route('/alerts', methods=['POST'])
@jwt_required()
def create_alert():
    current_user_id = str(get_jwt_identity())
    db = get_db()
    user = db.police.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    title = data.get('title')
    message = data.get('message')
    severity = data.get('severity', 'important') # emergency, important, info
    
    if not title or not message:
        return jsonify({'error': 'Title and message are required'}), 400
        
    import uuid
    alert_id = str(uuid.uuid4())
    new_alert = {
        '_id': alert_id,
        'title': title,
        'message': message,
        'severity': severity,
        'created_by': current_user_id,
        'station_id': user.get('station_id'),
        'created_at': datetime.datetime.utcnow()
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
        # Notifications always use the string alert_id from our create_alert logic
        db.notifications.delete_many({'alert_id': alert_id})
        return jsonify({'message': 'Alert and related notifications deleted successfully'}), 200
    else:
        # Check if it was already an ObjectId in DB
        return jsonify({'error': 'Alert not found'}), 404
