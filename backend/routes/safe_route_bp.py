# safe_route_bp.py
import os
import requests
import numpy as np
import pandas as pd
from flask import Blueprint, request, jsonify

safe_route_bp = Blueprint('safe_route', __name__)

crime_df_cache = None

def get_crime_data():
    global crime_df_cache
    if crime_df_cache is not None:
        return crime_df_cache
        
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    csv_path = os.path.join(base_dir, 'scripts', 'crime_kolkata.csv')
    
    if os.path.exists(csv_path):
        try:
            df = pd.read_csv(csv_path)
            crime_counts = df.groupby(['Latitude', 'Longitude'])['Crime_Count'].sum().reset_index()
            max_crime = crime_counts['Crime_Count'].max()
            if max_crime > 0:
                crime_counts['Risk_Score'] = crime_counts['Crime_Count'] / max_crime
            else:
                crime_counts['Risk_Score'] = 0
            crime_df_cache = crime_counts
            return crime_counts
        except Exception as e:
            print(f"Error loading crime data: {e}")
    return pd.DataFrame(columns=['Latitude', 'Longitude', 'Crime_Count', 'Risk_Score'])

def calculate_route_osrm(start_lat, start_lng, end_lat, end_lng, route_type='safe', mode='car'):
    """
    Query the public OSRM API for a route instead of storing a 40MB graph in RAM.
    """
    # Map 'car', 'bike', 'walking' to OSRM profiles
    osrm_profile = 'driving'
    if mode in ['bike', 'cycling']:
        osrm_profile = 'cycling'
    elif mode == 'walking':
        osrm_profile = 'foot'

    url = f"http://router.project-osrm.org/route/v1/{osrm_profile}/{start_lng},{start_lat};{end_lng},{end_lat}?overview=full&geometries=geojson"
    
    try:
        req = requests.get(url, timeout=10)
        res = req.json()
        if res.get("code") != "Ok":
            return None, {"error": "OSRM routing failed", "details": res}
            
        route = res["routes"][0]
        coordinates = route["geometry"]["coordinates"]
        route_length = route["distance"] # in meters
        route_time = route["duration"] # in seconds
        
        # Calculate safety score based on proximity of route points to crime hotspots
        normalized_route_risk = 0.0
        high_risk_zones_crossed = 0
        route_crime_probs = []
        
        crime_df = get_crime_data()
        if not crime_df.empty:
            crime_lats = crime_df['Latitude'].values
            crime_lngs = crime_df['Longitude'].values
            crime_risks = crime_df['Risk_Score'].values
            
            # Step through coordinates and check risk every few points
            step = max(1, len(coordinates) // 50)
            sample_points = coordinates[::step]
            
            for lng, lat in sample_points:
                crime_prob = 0
                dist_sq = (crime_lats - lat)**2 + (crime_lngs - lng)**2
                nearby_mask = dist_sq < (0.008**2) # ~800m
                if np.any(nearby_mask):
                    crime_prob = np.mean(crime_risks[nearby_mask])
                
                if crime_prob > 0.0:
                    route_crime_probs.append(crime_prob)
                if crime_prob > 0.5:
                    high_risk_zones_crossed += 1
                    
                normalized_route_risk += crime_prob
                
        mean_route_risk = float(np.mean(route_crime_probs)) if route_crime_probs else 0.0
        scaled_risk_penalty = mean_route_risk * 1500 
        
        safety_score = max(0, min(100, int(100 - scaled_risk_penalty)))
        
        if safety_score < 70 or high_risk_zones_crossed > 3:
            risk_level = "High"
        elif safety_score < 90 or high_risk_zones_crossed > 0:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        geojson = {
            "type": "Feature",
            "properties": {
                "distance": route_length,
                "duration": route_time,
                "safety_score": safety_score,
                "risk_level": risk_level,
                "time_efficiency": 100, # Simplified for OSRM
                "high_risk_zones": high_risk_zones_crossed,
                "normalized_risk": float(normalized_route_risk)
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            }
        }
        
        return geojson, None
    except Exception as e:
        return None, {"error": "Failed to connect to OSRM API", "details": str(e)}

@safe_route_bp.route('/', methods=['GET'])
def get_safe_route():
    try:
        start_lat = float(request.args.get('start_lat'))
        start_lng = float(request.args.get('start_lng'))
        end_lat = float(request.args.get('end_lat'))
        end_lng = float(request.args.get('end_lng'))
        route_type = request.args.get('type', 'safe')
        mode = request.args.get('mode', 'car')
        
        route_geojson, err = calculate_route_osrm(start_lat, start_lng, end_lat, end_lng, route_type, mode)
        if err:
            return jsonify(err), 400
            
        return jsonify(route_geojson), 200
    except ValueError:
        return jsonify({"error": "Invalid coordinates provided"}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

# Free public Nominatim geocoding via requests instead of the heavy geopy library
NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
HEADERS = {'User-Agent': 'sahayta_safe_route_app'}

@safe_route_bp.route('/geocode', methods=['GET'])
def geocode_location():
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "No query provided"}), 400
        
    try:
        query_search = f"{query}, Kolkata, West Bengal, India" if "kolkata" not in query.lower() else query
        req = requests.get(f"{NOMINATIM_BASE}/search", params={'q': query_search, 'format': 'json', 'limit': 1}, headers=HEADERS, timeout=10)
        data = req.json()
        
        if data:
            return jsonify({
                "lat": float(data[0]['lat']),
                "lng": float(data[0]['lon']),
                "address": data[0]['display_name']
            }), 200
            
        # Fallback
        req2 = requests.get(f"{NOMINATIM_BASE}/search", params={'q': query, 'format': 'json', 'limit': 1}, headers=HEADERS, timeout=10)
        data2 = req2.json()
        if data2:
             return jsonify({
                "lat": float(data2[0]['lat']),
                "lng": float(data2[0]['lon']),
                "address": data2[0]['display_name']
            }), 200
            
        return jsonify({"error": "Location not found"}), 404
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@safe_route_bp.route('/reverse-geocode', methods=['GET'])
def reverse_geocode_location():
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    if not lat or not lng:
        return jsonify({"error": "Missing coordinates"}), 400
        
    try:
        req = requests.get(f"{NOMINATIM_BASE}/reverse", params={'lat': lat, 'lon': lng, 'format': 'json'}, headers=HEADERS, timeout=10)
        data = req.json()
        if 'display_name' in data:
            return jsonify({"address": data['display_name']}), 200
        return jsonify({"error": "Address not found"}), 404
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@safe_route_bp.route('/autocomplete', methods=['GET'])
def autocomplete_location():
    query = request.args.get('q')
    if not query or len(query) < 3:
        return jsonify([]), 200
        
    try:
        query_search = f"{query}, Kolkata, West Bengal, India"
        req = requests.get(f"{NOMINATIM_BASE}/search", params={'q': query_search, 'format': 'json', 'limit': 5}, headers=HEADERS, timeout=10)
        data = req.json()
        
        results = []
        if data:
            for loc in data:
                results.append({"address": loc['display_name'], "lat": float(loc['lat']), "lng": float(loc['lon'])})
        else:
            req2 = requests.get(f"{NOMINATIM_BASE}/search", params={'q': query, 'format': 'json', 'limit': 5}, headers=HEADERS, timeout=10)
            data2 = req2.json()
            for loc in data2:
                results.append({"address": loc['display_name'], "lat": float(loc['lat']), "lng": float(loc['lon'])})
                
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@safe_route_bp.route('/map', methods=['GET'])
def get_safe_route_map():
    # Deprecated: Frontend handles the map rendering.
    return "Map rendering moved to frontend.", 200

@safe_route_bp.route('/crime-predictions', methods=['GET'])
def get_crime_predictions_data():
    bbox_str = request.args.get('bbox')
    crime_df = get_crime_data()
    
    if bbox_str:
        try:
            parts = bbox_str.split(',')
            minLat, minLng, maxLat, maxLng = float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3])
            filtered_df = crime_df[
                (crime_df['Latitude'] >= minLat) & (crime_df['Latitude'] <= maxLat) & 
                (crime_df['Longitude'] >= minLng) & (crime_df['Longitude'] <= maxLng)
            ]
        except Exception:
            filtered_df = crime_df
    else:
        filtered_df = crime_df
        
    points = [[row['Latitude'], row['Longitude'], row.get('Risk_Score', 0.5)] for _, row in filtered_df.iterrows()]
    return jsonify(points), 200
