import pandas as pd
import numpy as np
import folium
from folium.plugins import HeatMap, MarkerCluster
from sklearn.cluster import DBSCAN
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import os
import sys

# Configure Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Going up two levels from backend/scripts to project root, then down to research/crime_prediction
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))
DATA_PATH = os.path.join(PROJECT_ROOT, 'research', 'crime_prediction', 'crime_kolkata.csv')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'kolkata_crime_risk_map.html')

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

class CrimeRiskAI:
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.model_volume = None
        self.model_anomaly = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        
    def load_data(self):
        print(f"Loading data from {self.data_path}...")
        try:
            self.df = pd.read_csv(self.data_path)
            print("Data loaded successfully.")
            # Drop rows with missing lat/lon
            self.df.dropna(subset=['Latitude', 'Longitude'], inplace=True)
            return True
        except FileNotFoundError:
            print(f"Error: File not found at {self.data_path}")
            return False

    def preprocess_data(self):
        print("Preprocessing data...")
        # Encode categorical variables
        categorical_cols = ['TimeSlot']
        for col in categorical_cols:
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
        iso = IsolationForest(contamination=0.05, random_state=42)
        self.df['Anomaly'] = iso.fit_predict(self.df[['Crime_Count', 'Latitude', 'Longitude']])
        # -1 is anomaly, 1 is normal
        
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
            if score < 25: return 'Green' # Low
            elif score < 50: return 'Yellow' # Moderate
            elif score < 75: return 'Orange' # High
            else: return 'Red' # Critical
            
        self.df['Risk_Category'] = self.df['Risk_Index'].apply(get_risk_category)

    def generate_map(self):
        print(f"Generating map at {OUTPUT_FILE}...")
        
        # Center map on Kolkata
        kolkata_coords = [22.5726, 88.3639]
        m = folium.Map(location=kolkata_coords, zoom_start=12, tiles='OpenStreetMap')
        
        # 1. Heatmap Layer
        heat_data = self.df[['Latitude', 'Longitude', 'Crime_Count']].values.tolist()
        HeatMap(heat_data, radius=15, blur=20, max_zoom=1, name='Crime Heatmap').add_to(m)
        
        # 2. Suspected Crime Zones (Clusters of High Risk)
        # We will plot markers for high risk areas (Orange/Red)
        high_risk_df = self.df[self.df['Risk_Category'].isin(['Orange', 'Red'])]
        
        # Use MarkerCluster for cleaner UI
        marker_cluster = MarkerCluster(name="Suspected Zones").add_to(m)
        
        # Feature Group for Circle Markers (to show risk radius)
        risk_circles = folium.FeatureGroup(name="Risk Zones (Circles)")
        
        for idx, row in high_risk_df.iterrows():
            # Get peak time slot from original data (Mode of specific row context or just show recorded slot)
            time_slot = row['TimeSlot']
            
            popup_html = f"""
            <div style="width:200px">
                <b>Ward:</b> {int(row['Ward'])}<br>
                <b>Risk Score:</b> {row['Risk_Index']:.1f}/100<br>
                <b>Category:</b> <span style="color:{row['Risk_Category'].lower()}">{row['Risk_Category']}</span><br>
                <b>Recorded Volume:</b> {row['Crime_Count']}<br>
                <b>Predicted Volume:</b> {row['Predicted_Volume']:.1f}<br>
                <b>Peak Time:</b> {time_slot}<br>
            </div>
            """
            
            color_map = {'Green': 'green', 'Yellow': 'yellow', 'Orange': 'orange', 'Red': 'red'}
            color = color_map.get(row['Risk_Category'], 'blue')
            
            # Add Marker
            folium.Marker(
                location=[row['Latitude'], row['Longitude']],
                popup=folium.Popup(popup_html, max_width=250),
                icon=folium.Icon(color=color, icon='info-sign')
            ).add_to(marker_cluster)
            
            # Add Circle
            folium.CircleMarker(
                location=[row['Latitude'], row['Longitude']],
                radius=10,
                color=color,
                fill=True,
                fill_color=color,
                fill_opacity=0.4,
                popup=f"Risk: {row['Risk_Index']:.1f}"
            ).add_to(risk_circles)

        risk_circles.add_to(m)
        
        # Legend (Custom HTML)
        legend_html = '''
             <div style="position: fixed; 
                         bottom: 50px; left: 50px; width: 150px; height: 130px; 
                         border:2px solid grey; z-index:9999; font-size:14px;
                         background-color:white; opacity:0.9; padding: 10px;">
                 <b>Risk Levels</b><br>
                 <i style="background:green; width:10px; height:10px; display:inline-block;"></i> Low Risk<br>
                 <i style="background:yellow; width:10px; height:10px; display:inline-block;"></i> Moderate Risk<br>
                 <i style="background:orange; width:10px; height:10px; display:inline-block;"></i> High Risk<br>
                 <i style="background:red; width:10px; height:10px; display:inline-block;"></i> Critical Risk<br>
             </div>
             '''
        m.get_root().html.add_child(folium.Element(legend_html))
        
        folium.LayerControl().add_to(m)
        m.save(OUTPUT_FILE)
        print(f"Map saved successfully to {OUTPUT_FILE}")

    def run(self):
        if self.load_data():
            self.preprocess_data()
            self.perform_clustering()
            self.train_models()
            self.calculate_risk_index()
            self.generate_map()
        else:
            print("Aborting due to data load error.")

if __name__ == "__main__":
    ai = CrimeRiskAI(DATA_PATH)
    ai.run()
