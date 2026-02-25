
import sys
sys.stdout.reconfigure(line_buffering=True)
print("APP.PY STARTING...")


print("Importing flask...")
from flask import Flask, request, jsonify, redirect, url_for
print("Importing flask_cors...")
from flask_cors import CORS
print("Importing datetime...")
from datetime import timedelta
print("Importing dotenv...")
from dotenv import load_dotenv
import os
import threading
import time
import requests

print("Importing custom modules...")
from config import config
print("Importing MLService class...")
from ml_service import MLService

load_dotenv()

app = Flask(__name__)
# Enable CORS
CORS(app)

# Check for .env file
if not os.path.exists('.env'):
    print("\n\033[93mWARNING: .env file not found. Using default/environment variables.\033[0m")
    print("\033[93mIn production, ensure all secret keys are set securely.\033[0m\n")


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
print("Importing auth_routes...")
from routes.auth_routes import auth_bp
print("Importing fir_routes...")
from routes.fir_routes import fir_bp
print("Importing intelligence_routes...")
from routes.intelligence_routes import intelligence_bp
print("Importing police_routes...")
from routes.police_routes import police_bp

print("Importing police_views...")
from routes.police_views import police_views

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(fir_bp, url_prefix='/api/fir')
app.register_blueprint(intelligence_bp, url_prefix='/api/intelligence')
app.register_blueprint(police_bp, url_prefix='/api/police')
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
            print("🔄 Keep-alive ping sent", flush=True)
        except Exception as e:
            print("⚠️ Keep-alive failed:", e, flush=True)
        time.sleep(KEEP_ALIVE_INTERVAL)

def start_keep_alive():
    thread = threading.Thread(target=keep_alive, daemon=True)
    thread.start()

# Start the keep-alive thread
start_keep_alive()

if __name__ == '__main__':
    print("Starting Flask app...")
    try:
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
        print("Flask app finished.")
    except Exception as e:
        print(f"Flask failed to start: {e}")
