from functools import wraps
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from db import get_db, get_ist
import datetime
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies, jwt_required, get_jwt_identity
import os
from flask import send_from_directory

# Create a Blueprint for the Frontend (HTML Views) served by Backend
# Note: we use 'police_views' to distinguish from 'police_bp' (API)
police_views = Blueprint('police_views', __name__, template_folder='../templates')

def require_route_protection(f):
    """
    Decorator to enforce dynamic unique URL routes.
    Requires both `?username=...` and `&stationid=...`.
    If missing or mismatched, heavily redirects back to safe known state.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or 'username' not in session or 'station_id' not in session:
            return redirect(url_for('police_views.login'))
            
        active_username = session['username']
        active_station_id = session['station_id']
        
        url_username = request.args.get('username')
        url_station_id = request.args.get('stationid')
        
        # If parameters are missing entirely, inject them safely
        if not url_username or not url_station_id:
            return redirect(url_for(request.endpoint, username=active_username, stationid=active_station_id, **request.view_args))
            
        # If parameters exist but are tampered with / swapped tabs
        if url_username != active_username or str(url_station_id) != str(active_station_id):
            flash(f"Route protection triggered. Your active session is {active_username} at Station {active_station_id}.", "error")
            return redirect(url_for('police_views.dashboard', username=active_username, stationid=active_station_id))
            
        return f(*args, **kwargs)
    return decorated_function


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
            session['station_id'] = user.get('station_id')

            # Generate JWT token
            claims = {
                'role': 'police',
                'station_id': user.get('station_id')
            }
            access_token = create_access_token(identity=str(user['_id']), additional_claims=claims, expires_delta=datetime.timedelta(days=1))
            
            resp = redirect(url_for('police_views.dashboard', username=user['username'], stationid=user.get('station_id')))
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
            'created_at': get_ist()
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
        
    return jsonify({
        'email': user.get('email', 'N/A'),
        'phone': user.get('phone', 'N/A')
    })


def get_global_chart_data(db):
    import calendar
    from dateutil.relativedelta import relativedelta
    import datetime
    
    today = get_ist()
    # Go back 5 months from the current month to get 6 months total (including current)
    start_month_date = today - relativedelta(months=5)
    
    chart_labels = []
    chart_data_reported = []
    chart_data_resolved = []
    chart_data_rejected = []
    
    for i in range(6):
        target_date = start_month_date + relativedelta(months=i)
        
        # Start and end of the target month
        start_of_month = datetime.datetime(target_date.year, target_date.month, 1)
        last_day = calendar.monthrange(target_date.year, target_date.month)[1]
        end_of_month = datetime.datetime(target_date.year, target_date.month, last_day, 23, 59, 59, 999999)
        
        # Label: "Jan 2026"
        month_label = target_date.strftime('%b %Y')
        chart_labels.append(month_label)
        
        # Total Reported in this month (from both firs and archives collections based on submission_date)
        reported_firs = db.firs.count_documents({
            'submission_date': {'$gte': start_of_month, '$lte': end_of_month}
        })
        reported_archives = db.archives.count_documents({
            'submission_date': {'$gte': start_of_month, '$lte': end_of_month}
        })
        chart_data_reported.append(reported_firs + reported_archives)
        
        # Resolved Cases in this month (from archives based on last_updated or submission_date)
        resolved_count = db.archives.count_documents({
            'status': 'resolved',
            '$or': [
                {'last_updated': {'$gte': start_of_month, '$lte': end_of_month}},
                {'last_updated': {'$exists': False}, 'submission_date': {'$gte': start_of_month, '$lte': end_of_month}}
            ]
        })
        chart_data_resolved.append(resolved_count)
        
        # Rejected Cases in this month
        rejected_count = db.archives.count_documents({
            'status': 'rejected',
            '$or': [
                {'last_updated': {'$gte': start_of_month, '$lte': end_of_month}},
                {'last_updated': {'$exists': False}, 'submission_date': {'$gte': start_of_month, '$lte': end_of_month}}
            ]
        })
        chart_data_rejected.append(rejected_count)
        
    return chart_labels, chart_data_reported, chart_data_resolved, chart_data_rejected

@police_views.route('/dashboard')
@require_route_protection
def dashboard():
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    # Fetch Stats for this station only
    station_id = str(user.get('station_id')) if user.get('station_id') else None
    pending_count = db.firs.count_documents({'status': 'pending', 'station_id': station_id})
    
    # Fetch Recent FIRs for this station
    firs = list(db.firs.find({'station_id': station_id}).sort('submission_date', -1).limit(5))
    
    # Calculate Crime Trends (Last 6 Months Global)
    chart_labels, chart_data_reported, chart_data_resolved, chart_data_rejected = get_global_chart_data(db)
    
    return render_template('police/dashboard.html', 
                           user=user, 
                           pending_count=pending_count, 
                           firs=firs,
                           chart_labels=chart_labels,
                           chart_data_reported=chart_data_reported,
                           chart_data_resolved=chart_data_resolved,
                           chart_data_rejected=chart_data_rejected)

@police_views.route('/inbox')
@require_route_protection
def inbox():
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    # Fetch Pending & In Progress FIRs for this station
    station_id = str(user.get('station_id')) if user.get('station_id') else None
    firs = list(db.firs.find({
        'status': {'$in': ['pending', 'in_progress']},
        'station_id': station_id
    }).sort('submission_date', -1))
    
    return render_template('police/inbox.html', user=user, firs=firs)

@police_views.route('/archives')
@require_route_protection
def archives():
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    # Fetch Resolved & Rejected FIRs from archives
    firs = list(db.archives.find({
        'status': {'$in': ['resolved', 'rejected']}
    }).sort('submission_date', -1))
    
    unique_stations = set()
    
    # Enrich FIRs with resolving/rejecting officer details
    for fir in firs:
        officer_id = fir.get('resolved_by') or fir.get('rejected_by')
        fir['officer_name'] = 'Unknown'
        fir['officer_station'] = 'Unknown'
        
        if officer_id:
            officer = None
            try:
                from bson import ObjectId
                officer = db.police.find_one({'_id': ObjectId(officer_id)})
            except:
                pass
                
            if not officer:
                officer = db.police.find_one({'_id': officer_id})
                
            if officer:
                fir['officer_name'] = officer.get('full_name', 'Unknown')
                if officer.get('station_id'):
                     fir['officer_station'] = officer.get('station_id')
                
        if fir['officer_station'] and fir['officer_station'] != 'Unknown':
             unique_stations.add(fir['officer_station'])
             
    # Sort stations for the dropdown
    stations_list = sorted(list(unique_stations))
    
    return render_template('police/archives.html', user=user, firs=firs, stations=stations_list)

@police_views.route('/analytics')
@require_route_protection
def analytics():
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    # Calculate Stats for the specific station
    # Force station_id to be a string to match DB storage
    station_id = str(user.get('station_id')) if user.get('station_id') else None
    
    pending = db.firs.count_documents({'status': 'pending', 'station_id': station_id})
    resolved = db.archives.count_documents({'status': 'resolved', 'station_id': station_id})
    rejected = db.archives.count_documents({'status': 'rejected', 'station_id': station_id})
    
    print(f"DEBUG [Analytics route]: Officer {user.get('username')} at Station {station_id}")
    print(f"DEBUG [Analytics route]: Query resolved={resolved}, pending={pending}, rejected={rejected}")
    
    # Total Cases is the sum of Active FIRs + Archived FIRs for this station
    total_firs = db.firs.count_documents({'station_id': station_id})
    total_archives = db.archives.count_documents({'station_id': station_id})
    total = total_firs + total_archives
    
    stats = {
        'total': total,
        'resolved': resolved,
        'pending': pending,
        'rejected': rejected
    }
    
    chart_labels, chart_data_reported, chart_data_resolved, chart_data_rejected = get_global_chart_data(db)
    
    return render_template('police/analytics.html', user=user, stats=stats, 
                           chart_labels=chart_labels, chart_data_reported=chart_data_reported,
                           chart_data_resolved=chart_data_resolved, chart_data_rejected=chart_data_rejected)

@police_views.route('/analytics/map')
@require_route_protection
def crime_map():
    # Helper to get absolute path to assets/models/risk_map
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_dir, '..', 'assets', 'models', 'risk_map')
    return send_from_directory(output_dir, 'kolkata_crime_risk_data.json', max_age=0)

@police_views.route('/profile')
@require_route_protection
def profile():
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    return render_template('police/profile.html', user=user)

@police_views.route('/alerts')
@require_route_protection
def alerts():
    db = get_db()
    user = db.police.find_one({'username': session['username']})
    
    # Fetch Alerts
    alerts = list(db.community_alerts.find().sort('created_at', -1))
    
    return render_template('police/alerts.html', user=user, alerts=alerts)

@police_views.route('/')
def index():
    return render_template('police/index.html')
