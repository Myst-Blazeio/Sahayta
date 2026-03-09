
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
import logging

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman

from config import config
from ml_service import MLService

load_dotenv()

# Configure structured JSON/basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enforce Security Headers
Talisman(app, content_security_policy=None)

# Enforce Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Load Config
env = os.environ.get('FLASK_ENV', 'development')

# Allow ALL origins in dev, strictly specific in production via CORS
if env == 'production':
    CORS(app, supports_credentials=True, origins=["https://myst-blazeio.github.io", "http://localhost:5173"])
else:
    CORS(app, supports_credentials=True)


if not os.path.exists('.env'):
    logger.warning(".env file not found. Using default/environment variables.")

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
app.config['JWT_COOKIE_SECURE'] = (env == 'production') # Secure HTTPS-Only cookies in production
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

# Global Error Handler for 404
@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Not found'}), 404
    return "Page not found", 404

# Global API Error Overrides for 500
@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"Unhandled Exception: {e}", exc_info=True)
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Internal Server Error', 'message': str(e) if env != 'production' else 'An unexpected error occurred'}), 500
    return "Internal Server Error", 500

if __name__ == '__main__':
    logger.info("Starting Flask app...")
    try:
        port = int(os.environ.get('PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=(env != 'production'), threaded=True)
        logger.info("Flask app finished.")
    except Exception as e:
        logger.error(f"Flask failed to start: {e}")
