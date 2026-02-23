
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY','dev_secret_key_change_in_production')
    MONGO_URI = os.environ.get('MONGO_URI','mongodb://localhost:27017/fir_automation')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY','jwt_secret_key_change_in_production')
    ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')
    CRIME_MODEL_PATH = os.path.join(ASSETS_DIR, 'crime_model.pkl')
    BNS_ASSETS_PATH = os.path.join(ASSETS_DIR, 'bns_assets.pkl')
    
class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
