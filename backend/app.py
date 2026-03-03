
import sys
sys.stdout.reconfigure(line_buffering=True)

from flask import Flask, request, jsonify, redirect, url_for
from flask_cors import CORS
from datetime import timedelta
from dotenv import load_dotenv
import os
import threading
import time
import requests

from config import config
from ml_service import MLService

load_dotenv()

app = Flask(__name__)
CORS(app)

if not os.path.exists('.env'):
    print("WARNING: .env file not found. Using default/environment variables.")

# Load Config
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# Initialize Services
ml_service = MLService()

from db import init_db
init_db(app)

from flask_jwt_extended import JWTManager
app.config['JWT_SECRET_KEY'] = config[env].JWT_SECRET_KEY
jwt = JWTManager(app)

# Register Blueprints
from routes.auth_routes import auth_bp
from routes.fir_routes import fir_bp
from routes.intelligence_routes import intelligence_bp
from routes.police_routes import police_bp
from routes.police_views import police_views
from routes.safe_route_bp import safe_route_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(fir_bp, url_prefix='/api/fir')
app.register_blueprint(intelligence_bp, url_prefix='/api/intelligence')
app.register_blueprint(police_bp, url_prefix='/api/police')
app.register_blueprint(safe_route_bp, url_prefix='/api/safe-route')
app.register_blueprint(police_views, url_prefix='/police')

# JWT Config for Cookies
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
app.config['JWT_COOKIE_SECURE'] = False 
app.config['JWT_COOKIE_CSRF_PROTECT'] = False 
app.config['JWT_SESSION_COOKIE'] = True  # Expires on browser close

@app.route('/', methods=['GET'])
def index():
    # Redirect to the Backend Police Homepage
    return redirect(url_for('police_views.index'))

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'models_loaded': ml_service.initialized,
        'db_connected': True # Basic assumption if init_db passed
    }), 200

# Global Error Handler
@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Not found'}), 404
    return "Page not found", 404

KEEP_ALIVE_INTERVAL = 30  # seconds

def keep_alive():
    url = os.getenv("KEEP_ALIVE_URL")
    if not url:
        return  # silently skip

    while True:
        try:
            requests.get(url, timeout=5)
            print("OK: Keep-alive ping sent", flush=True)
        except Exception as e:
            print("WARN: Keep-alive failed:", e, flush=True)
        time.sleep(KEEP_ALIVE_INTERVAL)

def start_keep_alive():
    thread = threading.Thread(target=keep_alive, daemon=True)
    thread.start()

# Start the keep-alive thread
start_keep_alive()

if __name__ == '__main__':
    print("Starting Flask app...")
    try:
        port = int(os.environ.get('PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
        print("Flask app finished.")
    except Exception as e:
        print(f"Flask failed to start: {e}")
