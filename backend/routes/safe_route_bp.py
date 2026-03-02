# safe_route_bp.py
import os
import json
import numpy as np
import pandas as pd
import networkx as nx
import osmnx as ox
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

safe_route_bp = Blueprint('safe_route', __name__)

# Cache variables for the graph
# To avoid downloading and building the graph on each request
G_cache = None
crime_df_cache = None

def get_crime_data():
    global crime_df_cache
    if crime_df_cache is not None:
        return crime_df_cache
        
    # Load crime data
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    csv_path = os.path.join(base_dir, 'scripts', 'crime_kolkata.csv')
    
    if os.path.exists(csv_path):
        try:
            df = pd.read_csv(csv_path)
            # Group by lat/lng to get total crime counts per location
            crime_counts = df.groupby(['Latitude', 'Longitude'])['Crime_Count'].sum().reset_index()
            # Normalize crime counts to a 0-1 risk score
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


import threading

graph_lock = threading.Lock()

def get_graph(center_lat=22.5726, center_lng=88.3639, dist=7000):
    """
    Load the graph for Kolkata. Saves and loads from disk to avoid slow OSM queries.
    Reduced distance to 7km to fit 512MB RAM constraints on Render.
    """
    global G_cache
    if G_cache is not None:
        return G_cache
        
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    graph_path = os.path.join(base_dir, 'assets', 'models', 'kolkata_drive_graph.graphml')
    
    with graph_lock:
        # Check cache again inside lock just in case another thread already populated it
        if G_cache is not None:
            return G_cache
            
        if os.path.exists(graph_path):
            print("Loading 7km OSM graph from disk cache...")
            try:
                G = ox.load_graphml(graph_path)
                print("Graph loaded from disk and initialized.")
                G_cache = G
                return G
            except Exception as e:
                print(f"Error loading from disk: {e}")
                
        print("Downloading OSM network graph for Kolkata (7km radius)... this will take 1-2 minutes.")
        try:
            ox.settings.timeout = 1800 # 30 mins just in case
            ox.settings.memory = 268435456 # 256MB for free tier Render
            
            # Use 'drive' network type, but simplify=True to heavily reduce edge bloat
            point = (center_lat, center_lng)
            G = ox.graph_from_point(point, dist=dist, network_type='drive', simplify=True)
            
            G = ox.routing.add_edge_speeds(G)
            G = ox.routing.add_edge_travel_times(G)
            
            # Initialize default risk for all edges before saving to bake it into the graphml
            for u, v, k, data in G.edges(keys=True, data=True):
                data['risk_multiplier'] = 1.0
                
            # Save to disk for future fast runs
            os.makedirs(os.path.dirname(graph_path), exist_ok=True)
            ox.save_graphml(G, graph_path)
            print("Graph saved to disk for future fast loads.")
            
            G_cache = G
            return G
        except Exception as e:
            print(f"Error building graph: {e}")
            return None

def calculate_route(start_lat, start_lng, end_lat, end_lng, route_type='safe', mode='car'):
    G = get_graph()
    if G is None:
        return None, {"error": "Could not initialize road network graph"}
        
    try:
        # Find nearest nodes to start and end
        orig = ox.distance.nearest_nodes(G, X=start_lng, Y=start_lat)
        dest = ox.distance.nearest_nodes(G, X=end_lng, Y=end_lat)
        
        # Base weight is travel_time (fastest route)
        weight = 'travel_time'
        
        # Calculate fastest route regardless to have a baseline time
        try:
            fastest_route = nx.shortest_path(G, orig, dest, weight='travel_time')
            try:
                fastest_time = int(sum(ox.routing.route_to_gdf(G, fastest_route, weight='travel_time')['travel_time']))
            except:
                fastest_length = int(sum(ox.routing.route_to_gdf(G, fastest_route, weight='length')['length']))
                fastest_time = fastest_length / 10
        except Exception as e:
            fastest_time = 900 # Fallback
            fastest_route = None

        if route_type == 'safe':
            # To make it dynamic, we'll weigh edges by their proximity to high crime zones
            crime_df = get_crime_data()
            if not crime_df.empty:
                # Pre-extract lat/lng for faster distance checks
                crime_lats = crime_df['Latitude'].values
                crime_lngs = crime_df['Longitude'].values
                crime_risks = crime_df['Risk_Score'].values
                
                # Check if we've already cached safe_weight for this graph instance
                # Since get_graph caches G, we only want to do this heavy calculation once if possible,
                # or only on a small subset. Since crime data is static in this demo, we can just compute it once
                # for the whole graph.
                
                # Check first edge
                first_edge = next(iter(G.edges(data=True)))
                if 'safe_weight' not in first_edge[2]:
                    print("Calculating dynamic safe weights for all edges... this may take a moment.")
                    for u, v, k, data in G.edges(keys=True, data=True):
                        base_time = data.get('travel_time', data.get('length', 1.0) / 10)
                        
                        lat, lng = 0, 0
                        if 'geometry' in data:
                            lat = data['geometry'].centroid.y
                            lng = data['geometry'].centroid.x
                            
                        crime_prob = 0
                        if lat != 0:
                            # Fast numpy vectorized distance check
                            # ~500m is roughly 0.005 degrees
                            dist_sq = (crime_lats - lat)**2 + (crime_lngs - lng)**2
                            nearby_mask = dist_sq < (0.005**2)
                            if np.any(nearby_mask):
                                crime_prob = np.mean(crime_risks[nearby_mask])
                                
                        risk_multiplier = 1.0 + (crime_prob * 10) # Heavily penalize risky areas
                        data['safe_weight'] = base_time * risk_multiplier
                weight = 'safe_weight'
            
        # Calculate shortest path based on selected weight
        route = nx.shortest_path(G, orig, dest, weight=weight)
        
        # Calculate stats
        edges_gdf = ox.routing.route_to_gdf(G, route)
        route_length = int(sum(edges_gdf.get('length', [0])))
        
        # Adjust travel time based on transport mode
        try:
            base_route_time = int(sum(edges_gdf.get('travel_time', [route_length / 10])))
        except:
            base_route_time = int(route_length / 10)
            
        if mode == 'bike':
            route_time = int(base_route_time * 0.8) # Bikes filter traffic
        elif mode == 'cycling':
            route_time = int(route_length / 4.16) # ~15 km/h
        elif mode == 'walking':
            route_time = int(route_length / 1.38) # ~5 km/h
        else: # 'car'
            route_time = base_route_time

        # Adjust the baseline benchmark for the Time Efficiency scorecard so walking 
        # isn't constantly flagged as "10%" efficiency compared to a car
        try:
             if mode == 'bike':
                 fastest_time = int(fastest_time * 0.8)
             elif mode == 'cycling':
                 fastest_time = int(route_length / 4.16)
             elif mode == 'walking':
                 fastest_time = int(route_length / 1.38)
        except: pass

        # Dynamic Safety Score Calculation
        normalized_route_risk = 0
        high_risk_zones_crossed = 0
        route_crime_probs = []
        
        crime_df = get_crime_data()
        if not crime_df.empty:
            crime_lats = crime_df['Latitude'].values
            crime_lngs = crime_df['Longitude'].values
            crime_risks = crime_df['Risk_Score'].values
            
            for _, edge in edges_gdf.iterrows():
                length = edge.get('length', 1.0)
                lat, lng = 0, 0
                if hasattr(edge, 'geometry') and edge.geometry:
                    lat = edge.geometry.centroid.y
                    lng = edge.geometry.centroid.x
                    
                crime_prob = 0
                if lat != 0:
                    dist_sq = (crime_lats - lat)**2 + (crime_lngs - lng)**2
                    nearby_mask = dist_sq < (0.008**2) # Wider radius to match visual Heatmap blur
                    if np.any(nearby_mask):
                        crime_prob = np.mean(crime_risks[nearby_mask])
                
                if crime_prob > 0.0:
                    route_crime_probs.append(crime_prob)

                if crime_prob > 0.5:
                    high_risk_zones_crossed += 1
                    
                normalized_route_risk += (length * crime_prob)
                
        if route_crime_probs:
            mean_route_risk = float(np.mean(route_crime_probs))
        else:
            mean_route_risk = 0.0

        # Scale mean_route_risk significantly to show dynamic UI changes 
        # (since average risk_score is ~0.018)
        scaled_risk_penalty = mean_route_risk * 1500 
        
        if route_type == 'fast':
            scaled_risk_penalty *= 1.5

        safety_score = max(0, min(100, int(100 - scaled_risk_penalty)))
        
        if safety_score < 70 or high_risk_zones_crossed > 3:
            risk_level = "High"
        elif safety_score < 90 or high_risk_zones_crossed > 0:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Dynamic Time Efficiency Score
        time_efficiency_score = 100
        if route_time > 0 and fastest_time > 0:
             time_efficiency_score = max(0, min(100, int((fastest_time / route_time) * 100)))

        # Create GeoJSON line string
        nodes_gdf = ox.graph_to_gdfs(G, edges=False)
        route_nodes = nodes_gdf.loc[route]
        coordinates = [[row['x'], row['y']] for idx, row in route_nodes.iterrows()]
        
        geojson = {
            "type": "Feature",
            "properties": {
                "distance": route_length, # meters
                "duration": route_time,   # seconds
                "safety_score": safety_score,
                "risk_level": risk_level,
                "time_efficiency": time_efficiency_score,
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
        import traceback
        traceback.print_exc()
        return None, {"error": str(e)}


@safe_route_bp.route('/', methods=['GET'])
# Removed jwt_required for easier testing; add it back if citizen portal requires auth for map
def get_safe_route():
    try:
        start_lat = float(request.args.get('start_lat'))
        start_lng = float(request.args.get('start_lng'))
        end_lat = float(request.args.get('end_lat'))
        end_lng = float(request.args.get('end_lng'))
        route_type = request.args.get('type', 'safe') # 'safe' or 'fast'
        mode = request.args.get('mode', 'car') # 'car', 'bike', 'cycling', or 'walking'
        
        route_geojson, err = calculate_route(start_lat, start_lng, end_lat, end_lng, route_type, mode)
        if err:
            return jsonify(err), 400
            
        return jsonify(route_geojson), 200
    except ValueError:
        return jsonify({"error": "Invalid coordinates provided"}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

geolocator = Nominatim(user_agent="sahayta_safe_route")

@safe_route_bp.route('/geocode', methods=['GET'])
def geocode_location():
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "No query provided"}), 400
        
    try:
        # Append Kolkata to help narrow it down if not specified
        if "kolkata" not in query.lower() and "calcutta" not in query.lower():
            query_search = f"{query}, Kolkata, West Bengal, India"
        else:
            query_search = query
            
        location = geolocator.geocode(query_search, timeout=10)
        
        if location:
            return jsonify({
                "lat": location.latitude,
                "lng": location.longitude,
                "address": location.address
            }), 200
        else:
            # Fallback retry without Kolkata append just in case it's a very specific landmark
            location = geolocator.geocode(query, timeout=10)
            if location:
                 return jsonify({
                    "lat": location.latitude,
                    "lng": location.longitude,
                    "address": location.address
                }), 200
            
            return jsonify({"error": "Location not found"}), 404
            
    except GeocoderTimedOut:
        return jsonify({"error": "Geocoding service timed out"}), 504
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@safe_route_bp.route('/reverse-geocode', methods=['GET'])
def reverse_geocode_location():
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    if not lat or not lng:
        return jsonify({"error": "Missing coordinates"}), 400
        
    try:
        location = geolocator.reverse(f"{lat}, {lng}", timeout=10)
        if location:
            return jsonify({
                "address": location.address
            }), 200
        return jsonify({"error": "Address not found"}), 404
    except GeocoderTimedOut:
        return jsonify({"error": "Geocoding service timed out"}), 504
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@safe_route_bp.route('/autocomplete', methods=['GET'])
def autocomplete_location():
    query = request.args.get('q')
    if not query or len(query) < 3:
        return jsonify([]), 200
        
    try:
        query_search = f"{query}, Kolkata, West Bengal, India"
        locations = geolocator.geocode(query_search, exactly_one=False, limit=5, timeout=10)
        
        results = []
        if locations:
            for loc in locations:
                results.append({
                    "address": loc.address,
                    "lat": loc.latitude,
                    "lng": loc.longitude
                })
        else:
            # Fallback without kolkata
            locations = geolocator.geocode(query, exactly_one=False, limit=5, timeout=10)
            if locations:
                for loc in locations:
                    results.append({
                        "address": loc.address,
                        "lat": loc.latitude,
                        "lng": loc.longitude
                    })
        return jsonify(results), 200
        
    except GeocoderTimedOut:
        return jsonify({"error": "Geocoding service timed out"}), 504
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

import folium
from folium.plugins import HeatMap

@safe_route_bp.route('/map', methods=['GET'])
def get_safe_route_map():
    try:
        start_lat = float(request.args.get('start_lat', 22.5726))
        start_lng = float(request.args.get('start_lng', 88.3639))
        end_lat = float(request.args.get('end_lat', 22.6026))
        end_lng = float(request.args.get('end_lng', 88.3939))
        route_type = request.args.get('type', 'safe')
        mode = request.args.get('mode', 'car')
        bbox_str = request.args.get('bbox')

        center_lat = (start_lat + end_lat) / 2.0
        center_lng = (start_lng + end_lng) / 2.0

        m = folium.Map(
            location=[center_lat, center_lng], 
            zoom_start=13, 
            tiles='CartoDB voyager',
            min_lat=22.4000,
            max_lat=22.7500,
            min_lon=88.2500,
            max_lon=88.5000,
            max_bounds=True
        )

        # Custom CSS to strongly target the canvas where the heatmap is drawn
        css = """
        <style>
            .leaflet-overlay-pane canvas {
                opacity: 0.40 !important;
            }
        </style>
        """
        m.get_root().header.add_child(folium.Element(css))

        # Calculate route FIRST so we can use it to trim the heatmap
        route_geojson, err = calculate_route(start_lat, start_lng, end_lat, end_lng, route_type, mode)
        poly_coords = []
        if not err and route_geojson and isinstance(route_geojson, dict):
            geom = route_geojson.get('geometry', {})
            if isinstance(geom, dict):
                coords = geom.get('coordinates', [])
                poly_coords = [(lat, lng) for lng, lat in coords]

        # Add crime heatmap
        crime_df = get_crime_data()
        
        if bbox_str:
            try:
                parts = bbox_str.split(',')
                minLat, minLng, maxLat, maxLng = float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3])
                filtered_df = crime_df[
                    (crime_df['Latitude'] >= minLat) & (crime_df['Latitude'] <= maxLat) & 
                    (crime_df['Longitude'] >= minLng) & (crime_df['Longitude'] <= maxLng)
                ]
            except:
                filtered_df = crime_df
        else:
            filtered_df = crime_df

        # Trim heatmap strictly to within 1km of the route line
        if poly_coords and not filtered_df.empty:
            route_lats = np.array([p[0] for p in poly_coords])
            route_lngs = np.array([p[1] for p in poly_coords])
            
            crime_lats = filtered_df['Latitude'].values
            crime_lngs = filtered_df['Longitude'].values
            
            mask = np.zeros(len(filtered_df), dtype=bool)
            threshold_sq = 0.0045 ** 2 # Approx 500m in degrees squared
            
            for i in range(len(crime_lats)):
                lat = crime_lats[i]
                lng = crime_lngs[i]
                dist_sq = (route_lats - lat)**2 + (route_lngs - lng)**2
                if np.min(dist_sq) <= threshold_sq:
                    mask[i] = True
                    
            filtered_df = filtered_df[mask]

        heat_data = [[row['Latitude'], row['Longitude'], row.get('Risk_Score', 0.5)] for _, row in filtered_df.iterrows()]
        HeatMap(
            heat_data, 
            radius=20, 
            blur=15, 
            max_zoom=15, 
            name='Crime Heatmap', 
            gradient={0.4:'blue', 0.7:'coral', 1.0:'red'}
        ).add_to(m)

        # Add markers
        folium.Marker(location=[start_lat, start_lng], popup='Start', icon=folium.Icon(color='green')).add_to(m)
        folium.Marker(location=[end_lat, end_lng], popup='Destination', icon=folium.Icon(color='red')).add_to(m)

        if poly_coords:
            color = '#22c55e' if route_type == 'safe' else '#3b82f6'
            # Create a feature group for the route
            route_fg = folium.FeatureGroup(name='Suggested Route')
            folium.PolyLine(poly_coords, color=color, weight=6, opacity=0.8).add_to(route_fg)
            # Add white inner stroke for visibility
            folium.PolyLine(poly_coords, color='#ffffff', weight=2, opacity=0.5).add_to(route_fg)
            route_fg.add_to(m)
            
            # Fit bounds
            m.fit_bounds(m.get_bounds())

        # Add onscreen toggle
        folium.LayerControl(collapsed=False).add_to(m)

        html_string = m.get_root().render()
        return html_string, 200, {'Content-Type': 'text/html; charset=utf-8'}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"Error generating map: {str(e)}", 500

@safe_route_bp.route('/crime-predictions', methods=['GET'])
def get_crime_predictions_data():
    """Returns crime hotspots for rendering the heatmap overlay, optionally filtered by bounding box"""
    bbox_str = request.args.get('bbox')
    crime_df = get_crime_data()
    
    if bbox_str:
        try:
            # bbox expected format: minLat,minLng,maxLat,maxLng
            parts = bbox_str.split(',')
            minLat = float(parts[0])
            minLng = float(parts[1])
            maxLat = float(parts[2])
            maxLng = float(parts[3])
            
            # Filter the dataframe
            filtered_df = crime_df[
                (crime_df['Latitude'] >= minLat) & 
                (crime_df['Latitude'] <= maxLat) & 
                (crime_df['Longitude'] >= minLng) & 
                (crime_df['Longitude'] <= maxLng)
            ]
        except Exception as e:
            # If parsing fails, fall back to all points within a reasonable area or all data
            filtered_df = crime_df
    else:
        filtered_df = crime_df
        
    points = []
    for _, row in filtered_df.iterrows():
        # [lat, lng, intensity]
        points.append([row['Latitude'], row['Longitude'], row.get('Risk_Score', 0.5)])
        
    return jsonify(points), 200
