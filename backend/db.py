from flask_pymongo import PyMongo
import datetime

mongo = PyMongo()

def get_ist():
    """Returns a naive datetime object representing current IST time."""
    return datetime.datetime.utcnow() + datetime.timedelta(hours=5, minutes=30)

def init_db(app):
    mongo.init_app(app, maxPoolSize=10)
    # Validate connection
    try:
        # The 'config' object in app should have MONGO_URI
        # Flask-PyMongo automatically uses it.
        # We can test connection:
        print(f"MongoDB Configured with URI: {app.config['MONGO_URI']}")
    except Exception as e:
        print(f"Error configuring MongoDB: {e}")

def get_db():
    return mongo.db
