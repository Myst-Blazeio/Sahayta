from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from db import get_db
import datetime
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies, jwt_required, get_jwt_identity

# Create a Blueprint for the Frontend (HTML Views) served by Backend
# Note: we use 'police_views' to distinguish from 'police_bp' (API)
police_views = Blueprint('police_views', __name__, template_folder='../templates')

@police_views.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        db = get_db()
        user = db.police.find_one({'username': username})
        
        if user and check_password_hash(user.get('password_hash'), password):
            session['user_id'] = str(user['_id'])
            session['role'] = 'police'
            session['username'] = user['username']

            # Generate JWT token
            claims = {
                'role': 'police',
                'station_id': user.get('station_id')
            }
            access_token = create_access_token(identity=str(user['_id']), additional_claims=claims, expires_delta=datetime.timedelta(days=1))
            
            resp = redirect(url_for('police_views.dashboard'))
            set_access_cookies(resp, access_token)
            return resp
        
        flash('Invalid username or password', 'error')
        
    return render_template('police/login.html')

@police_views.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        # Basic signup logic mirroring the API
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
             return render_template('police/signup.html')

        db = get_db()
        if db.police.find_one({'username': username}):
            flash('Username already exists', 'error')
            return render_template('police/signup.html')
            
        new_user = {
            'username': username,
            'password_hash': generate_password_hash(password),
            'full_name': full_name,
            'police_id': police_id,
            'station_id': station_id,
            'phone': phone,
            'email': email,
            'role': 'police',
            'created_at': datetime.datetime.utcnow()
        }
        db.police.insert_one(new_user)
        flash('Account created! Please login.', 'success')
        return redirect(url_for('police_views.login'))

    return render_template('police/signup.html')

@police_views.route('/logout')
def logout():
    session.clear()
    resp = redirect(url_for('police_views.login'))
    unset_jwt_cookies(resp)
    return resp

@police_views.route('/stats')
def stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    user_id_str = str(user['_id'])
    
    # Calculate stats for profile page
    # FIRs handled/received by this officer
    received_count = db.firs.count_documents({'received_by': user_id_str})
    # Resolved by this officer (look in archives for resolved status + resolved_by)
    resolved_count = db.archives.count_documents({'resolved_by': user_id_str, 'status': 'resolved'})
    
    return jsonify({
        'email': user.get('email', 'N/A'),
        'phone': user.get('phone', 'N/A'),
        'received_count': received_count,
        'resolved_count': resolved_count
    })


@police_views.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('police_views.login'))
        
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    # Fetch Stats
    pending_count = db.firs.count_documents({'status': 'pending'})
    
    # Fetch Recent FIRs
    firs = list(db.firs.find().sort('submission_date', -1).limit(5))
    
    # Simple Chart Data (Dummy/Placeholder for now, or real aggregation)
    # Aggregation for Crime Trends
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = list(db.firs.aggregate(pipeline))
    
    chart_labels = [item['_id'].title() for item in status_counts]
    chart_data = [item['count'] for item in status_counts]
    
    return render_template('police/dashboard.html', 
                           user=user, 
                           pending_count=pending_count, 
                           firs=firs,
                           chart_labels=chart_labels,
                           chart_data=chart_data)

@police_views.route('/inbox')
def inbox():
    if 'user_id' not in session:
        return redirect(url_for('police_views.login'))
        
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    # Fetch Pending & In Progress FIRs for this station (or all for now if no station filter logic strictness)
    # Assuming station_id filter should apply if we had multiple stations. For now, fetch all non-archived.
    firs = list(db.firs.find({
        'status': {'$in': ['pending', 'in_progress']}
    }).sort('submission_date', -1))
    
    return render_template('police/inbox.html', user=user, firs=firs)

@police_views.route('/archives')
def archives():
    if 'user_id' not in session:
        return redirect(url_for('police_views.login'))
        
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    # Fetch Resolved & Rejected FIRs from archives
    firs = list(db.archives.find({
        'status': {'$in': ['resolved', 'rejected']}
    }).sort('submission_date', -1))
    
    # print(f"DEBUG: Found {len(firs)} archived FIRs for user {user.get('username')}")
    
    return render_template('police/archives.html', user=user, firs=firs)

@police_views.route('/analytics')
def analytics():
    if 'user_id' not in session:
        return redirect(url_for('police_views.login'))
        
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    # Calculate Stats
    total = db.firs.count_documents({})
    resolved = db.archives.count_documents({'status': 'resolved'})
    pending = db.firs.count_documents({'status': 'pending'})
    rejected = db.archives.count_documents({'status': 'rejected'})
    
    stats = {
        'total': total,
        'resolved': resolved,
        'pending': pending,
        'rejected': rejected
    }
    
    return render_template('police/analytics.html', user=user, stats=stats)

@police_views.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('police_views.login'))
        
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    return render_template('police/profile.html', user=user)

@police_views.route('/alerts')
def alerts():
    if 'user_id' not in session:
        return redirect(url_for('police_views.login'))
        
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    # Fetch Alerts
    alerts = list(db.community_alerts.find().sort('created_at', -1))
    
    return render_template('police/alerts.html', user=user, alerts=alerts)

@police_views.route('/')
def index():
    return render_template('police/index.html')
