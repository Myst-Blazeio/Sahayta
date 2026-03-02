import pandas as pd
import numpy as np
import folium
from folium.plugins import HeatMap, MarkerCluster
from sklearn.cluster import DBSCAN
from sklearn.ensemble import RandomForestRegressor, IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import os
import sys
import joblib
import json

# Configure Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Going up two levels from backend/scripts to project root, then down to research/crime_prediction
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))
DATA_PATH = os.path.join(PROJECT_ROOT, 'scripts', 'crime_kolkata.csv')
ASSETS_DIR = os.path.join(PROJECT_ROOT, 'backend', 'assets')
MODELS_DIR = os.path.join(ASSETS_DIR, 'models', 'risk_map')

# Ensure output directory exists
os.makedirs(MODELS_DIR, exist_ok=True)

class CrimeRiskAI:
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.model_volume = None
        self.model_anomaly = None
        self.model_classification = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        
    def load_data(self):
        print(f"Loading data from {self.data_path}...")
        try:
            self.df = pd.read_csv(self.data_path)
            print("Data loaded successfully.")
            # Drop rows with missing lat/lon
            self.df.dropna(subset=['Latitude', 'Longitude'], inplace=True)
            
            # --- MOCK DATA FOR CLASSIFICATION ---
            # If the user's CSV is missing the required columns, mock them for the dashboard demonstration
            if 'crime_type' not in self.df.columns and 'Crime_Type' not in self.df.columns:
                print("Mocking Crime_Type and Police_Station for classification visualization...")
                crime_types = ['Theft', 'Assault', 'Burglary', 'Robbery', 'Cybercrime', 'Fraud']
                np.random.seed(42)
                self.df['Crime_Type'] = np.random.choice(crime_types, size=len(self.df), p=[0.4, 0.2, 0.15, 0.1, 0.1, 0.05])
                self.df['Police_Station'] = 'Station_' + self.df['Ward'].astype(str)
                
            return True
        except FileNotFoundError:
            print(f"Error: File not found at {self.data_path}")
            return False

    def preprocess_data(self):
        print("Preprocessing data...")
        # Encode categorical variables
        categorical_cols = ['TimeSlot', 'Crime_Type', 'Police_Station']
        for col in categorical_cols:
            if col in self.df.columns:
                le = LabelEncoder()
                self.df[f'{col}_Encoded'] = le.fit_transform(self.df[col].astype(str))
                self.label_encoders[col] = le
            
    def perform_clustering(self):
        print("Performing spatial clustering (DBSCAN)...")
        # Clustering based on Lat, Lon
        coords = self.df[['Latitude', 'Longitude']].values
        
        # DBSCAN: epsilon=0.005 (approx 500m), min_samples=5
        # Weighted by Crime_Count effectively repeats points or we can use sample_weight if supported by implementation,
        # but standard DBSCAN doesn't take weight directly for density definition in sklearn easily without expansion.
        # For simplicity in identifying spatial hotspots regardless of weight first:
        db = DBSCAN(eps=0.005, min_samples=5, metric='haversine').fit(np.radians(coords))
        self.df['Cluster'] = db.labels_
        
        n_clusters = len(set(db.labels_)) - (1 if -1 in db.labels_ else 0)
        print(f"identified {n_clusters} clusters.")

    def train_models(self):
        print("Training predictive models...")
        
        # 1. Crime Volume Prediction (Random Forest Regressor)
        features = ['Ward', 'Month', 'Year', 'TimeSlot_Encoded', 'Latitude', 'Longitude']
        X = self.df[features]
        y = self.df['Crime_Count']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model_volume = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model_volume.fit(X_train, y_train)
        score = self.model_volume.score(X_test, y_test)
        print(f"Volume Prediction Model R2 Score: {score:.2f}")
        
        # 2. Anomaly Detection (Isolation Forest)
        # To find unusual spikes in crime
        self.model_anomaly = IsolationForest(contamination=0.05, random_state=42)
        self.df['Anomaly'] = self.model_anomaly.fit_predict(self.df[['Crime_Count', 'Latitude', 'Longitude']])
        # -1 is anomaly, 1 is normal
        
        # 3. Crime Type Prediction (Random Forest Classifier)
        if 'Crime_Type_Encoded' in self.df.columns:
            print("Training Classification model for Crime Type...")
            y_class = self.df['Crime_Type_Encoded']
            Xc_train, Xc_test, yc_train, yc_test = train_test_split(X, y_class, test_size=0.2, random_state=42)
            self.model_classification = RandomForestClassifier(n_estimators=50, random_state=42)
            self.model_classification.fit(Xc_train, yc_train)
            
            # Predict crime types and probabilities
            pred_classes = self.model_classification.predict(X)
            pred_probs = self.model_classification.predict_proba(X)
            max_probs = np.max(pred_probs, axis=1) # The confidence of the prediction
            
            # Decode the predicted classes
            le_crime_type = self.label_encoders['Crime_Type']
            self.df['Predicted_Crime_Type'] = le_crime_type.inverse_transform(pred_classes)
            self.df['Prediction_Confidence'] = max_probs * 100
        
        # Add predictions to dataframe for risk calculation
        self.df['Predicted_Volume'] = self.model_volume.predict(X)

    def calculate_risk_index(self):
        print("Calculating Risk Index...")
        # Normalize Crime_Count and Predicted_Volume
        # Risk = w1 * Norm(Crime_Count) + w2 * Norm(Predicted_Volume) + Anomaly_Penalty
        
        # Simple normalization 0-1
        max_crime = self.df['Crime_Count'].max()
        max_pred = self.df['Predicted_Volume'].max()
        
        self.df['Norm_Crime'] = self.df['Crime_Count'] / max_crime
        self.df['Norm_Pred'] = self.df['Predicted_Volume'] / max_pred
        
        # Anomaly penalty: if anomaly (-1), add risk.
        self.df['Anomaly_Score'] = self.df['Anomaly'].apply(lambda x: 0.2 if x == -1 else 0)
        
        # Risk Index Formula (Weights can be adjusted)
        # 40% Historic Volume + 40% Predicted Volume + 20% Anomaly
        self.df['Risk_Score_Raw'] = (0.4 * self.df['Norm_Crime']) + (0.4 * self.df['Norm_Pred']) + self.df['Anomaly_Score']
        
        # Scale to 0-100
        self.df['Risk_Index'] = self.df['Risk_Score_Raw'] * 100
        self.df['Risk_Index'] = self.df['Risk_Index'].clip(0, 100)
        
        # Categorize
        def get_risk_category(score):
            if score < 40: return 'Green' # Low
            elif score < 65: return 'Yellow' # Moderate
            elif score < 85: return 'Orange' # High
            else: return 'Red' # Critical
            
        self.df['Risk_Category'] = self.df['Risk_Index'].apply(get_risk_category)

    def generate_map(self):
        # Map generation is now handled by the frontend.
        pass

    def export_data_and_models(self):
        print("Exporting models and JSON data...")
        
        # 1. Export Models
        if self.model_volume is not None:
            joblib.dump(self.model_volume, os.path.join(MODELS_DIR, 'model_volume.pkl'))
        if getattr(self, 'model_anomaly', None) is not None:
            joblib.dump(self.model_anomaly, os.path.join(MODELS_DIR, 'model_anomaly.pkl'))
        if self.model_classification is not None:
            joblib.dump(self.model_classification, os.path.join(MODELS_DIR, 'model_classification.pkl'))
        if self.label_encoders:
            joblib.dump(self.label_encoders, os.path.join(MODELS_DIR, 'label_encoders.pkl'))
            
        print(f"Models saved successfully to {MODELS_DIR}")
        
        # 2. Export Data as JSON
        json_file = os.path.join(MODELS_DIR, 'kolkata_crime_risk_data.json')
        export_cols = ['Latitude', 'Longitude', 'Crime_Count', 'Ward', 'TimeSlot', 
                       'Predicted_Volume', 'Risk_Score_Raw', 'Risk_Index', 'Risk_Category']
        if 'Predicted_Crime_Type' in self.df.columns:
            export_cols.extend(['Predicted_Crime_Type', 'Prediction_Confidence'])
            
        export_df = self.df[export_cols].copy()
        export_df.to_json(json_file, orient='records', default_handler=str)
        print(f"Data saved successfully to {json_file}")

    def run(self):
        if self.load_data():
            self.preprocess_data()
            self.perform_clustering()
            self.train_models()
            self.calculate_risk_index()
            # self.generate_map()

            self.export_data_and_models()
        else:
            print("Aborting due to data load error.")

if __name__ == "__main__":
    ai = CrimeRiskAI(DATA_PATH)
    ai.run()
