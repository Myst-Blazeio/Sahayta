from flask_pymongo import PyMongo

mongo = PyMongo()

def init_db(app):
    mongo.init_app(app)
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
