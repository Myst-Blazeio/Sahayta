
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from db import get_db
import datetime
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
         return jsonify({'error': 'Username and password required'}), 400

    db = get_db()
    # Simple check if setup is correct
    if db is None:
         return jsonify({'error': 'Database not connected'}), 500

    # Check in users collection first, then police
    user = db.users.find_one({'username': username})
    if user:
        print(f"DEBUG: Found user {username} in 'users' collection. Hash: {user.get('password_hash')}")
    else:
        user = db.police.find_one({'username': username})
        if user:
            print(f"DEBUG: Found user {username} in 'police' collection. Hash: {user.get('password_hash')}")
        else:
            print(f"DEBUG: User {username} not found in any collection.")
    
    if user and check_password_hash(user.get('password_hash', ''), password):
        # Determine role from user object or default
        role = user.get('role', 'citizen')
        
        claims = {'role': role}
        if role == 'police':
            claims['station_id'] = user.get('station_id')
        
        access_token = create_access_token(identity=str(user['_id']), additional_claims=claims, expires_delta=datetime.timedelta(days=1))
        print(f"DEBUG: Login successful for {username}")
        return jsonify({
            'token': access_token, 
            'user': {
                '_id': str(user['_id']),
                'username': user.get('username'),
                'role': role,
                'full_name': user.get('full_name'),
                'email': user.get('email'),
                'phone': user.get('phone'),
                'station_id': user.get('station_id'),
                'police_id': user.get('police_id'),
                'aadhar': user.get('aadhar')
            }
        }), 200
    
    print(f"DEBUG: Login failed for {username}. Mismatch or no user.")
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/stations', methods=['GET'])
def get_stations():
    # Return fixed list of 6 stations for testing as requested
    stations = [
        {'station_id': '100', 'station_name': 'Police Station 1'},
        {'station_id': '200', 'station_name': 'Police Station 2'},
        {'station_id': '300', 'station_name': 'Police Station 3'},
        {'station_id': '400', 'station_name': 'Police Station 4'},
        {'station_id': '500', 'station_name': 'Police Station 5'},
        {'station_id': '600', 'station_name': 'Police Station 6'}
    ]
    return jsonify(stations), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name', '')
    role = data.get('role', 'citizen') 
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
        
    db = get_db()
    
    # Check uniqueness across both collections
    if db.users.find_one({'username': username}) or db.police.find_one({'username': username}):
        return jsonify({'error': 'User already exists'}), 400
        
    new_user = {
        'username': username,
        'full_name': full_name,
        'role': role,
        'created_at': datetime.datetime.utcnow()
    }

    collection = db.users # Default

    # Role specific validation
    if role == 'citizen':
        aadhar = data.get('aadhar')
        phone = data.get('phone')
        email = data.get('email')
        
        if not aadhar or not phone:
             return jsonify({'error': 'Aadhar and Phone number are required for citizens'}), 400
             
        # Check uniqueness
        if db.users.find_one({'aadhar': aadhar}):
            return jsonify({'error': 'Aadhar already registered'}), 400
        if db.users.find_one({'phone': phone}):
            return jsonify({'error': 'Phone number already registered'}), 400
            
        new_user['aadhar'] = aadhar
        new_user['phone'] = phone
        new_user['email'] = email
        collection = db.users
        
    elif role == 'police':
        police_id = data.get('police_id')
        station_id = data.get('station_id') 
        phone = data.get('phone')
        email = data.get('email')
        
        if not police_id:
            return jsonify({'error': 'Police ID is required for police personnel'}), 400
        
        if not station_id:
            return jsonify({'error': 'Station ID is required for police personnel'}), 400
            
        if db.police.find_one({'police_id': police_id}):
            return jsonify({'error': 'Police ID already registered'}), 400
            
        new_user['police_id'] = str(police_id)
        new_user['station_id'] = str(station_id)
        if phone: new_user['phone'] = phone
        if email: new_user['email'] = email
        collection = db.police
    
    new_user['password_hash'] = generate_password_hash(password)
    
    collection.insert_one(new_user)
    
    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    db = get_db()
    
    if db is None:
        return jsonify({'error': 'Database error'}), 500
        
    # Check users first
    user = db.users.find_one({'_id': ObjectId(current_user_id)})
    if not user:
        # Check police
        user = db.police.find_one({'_id': ObjectId(current_user_id)})
        
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Convert ObjectId to string and remove password
    user['_id'] = str(user['_id'])
    user.pop('password_hash', None)
    
    # For police, resolve station name
    if user.get('role') == 'police':
        station_id = user.get('station_id')
        # In a real app, query stations collection. Here we map manually as per get_stations
        stations_map = {
            '100': 'Police Station 1',
            '200': 'Police Station 2',
            '300': 'Police Station 3',
            '400': 'Police Station 4',
            '500': 'Police Station 5',
            '600': 'Police Station 6'
        }
        user['station_name'] = stations_map.get(station_id, f"Station {station_id}")
        
    return jsonify(user), 200
