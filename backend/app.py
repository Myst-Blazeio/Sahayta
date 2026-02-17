
from flask import Flask, request, jsonify, redirect, url_for
from flask_cors import CORS
from datetime import timedelta
from dotenv import load_dotenv
import os

from config import config
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
from routes.auth_routes import auth_bp
from routes.fir_routes import fir_bp
from routes.intelligence_routes import intelligence_bp
from routes.police_routes import police_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(fir_bp, url_prefix='/api/fir')
app.register_blueprint(intelligence_bp, url_prefix='/api/intelligence')
app.register_blueprint(police_bp, url_prefix='/police')

# JWT Config for Cookies
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
app.config['JWT_COOKIE_SECURE'] = False 
app.config['JWT_COOKIE_CSRF_PROTECT'] = False 

@app.route('/', methods=['GET'])
def index():
    return redirect(url_for('police.index'))

@app.route('/api/health', methods=['GET'])
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
