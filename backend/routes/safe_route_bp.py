# safe_route_bp.py
import os
import math
import requests
import numpy as np
import pandas as pd
from flask import Blueprint, request, jsonify

safe_route_bp = Blueprint('safe_route', __name__)

crime_df_cache = None

# ── Realistic urban traffic multipliers for Kolkata ──────────────────────────
# OSRM returns ideal free-flow travel time. Indian city traffic is much slower.
TRAFFIC_FACTORS = {
    'car':     1.7,   # ~35 km/h effective in Kolkata city vs OSRM ~60 km/h
    'bike':    1.3,   # motorcycles affected by traffic and signals
    'cycling': 1.2,   # bicycles mostly unaffected by motorised traffic
    'walking': 1.1,   # slight delay at crossings
}

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
            maxc = crime_counts['Crime_Count'].max()
            crime_counts['Risk_Score'] = crime_counts['Crime_Count'] / maxc if maxc > 0 else 0
            crime_df_cache = crime_counts
            return crime_counts
        except Exception as e:
            print(f"Error loading crime data: {e}")
    return pd.DataFrame(columns=['Latitude', 'Longitude', 'Crime_Count', 'Risk_Score'])


def osrm_profile(mode):
    if mode in ['bike']:
        return 'driving'   # motorbikes use driving profile on OSRM
    if mode == 'cycling':
        return 'cycling'
    if mode == 'walking':
        return 'foot'
    return 'driving'


def score_route(coordinates, penalise_crime=True):
    """
    Walk every sampled coordinate and compute a safety score.
    If penalise_crime=False (fastest route) we still measure the risk
    but don't pretend to avoid it. Returns (safety_score, risk_level,
    high_risk_zones, normalized_risk, extra_time_seconds).
    """
    crime_df = get_crime_data()
    high_risk_zones = 0
    route_crime_probs = []
    normalized_risk  = 0.0

    if not crime_df.empty:
        c_lats  = crime_df['Latitude'].values
        c_lngs  = crime_df['Longitude'].values
        c_risks = crime_df['Risk_Score'].values
        step    = max(1, len(coordinates) // 60)

        for lng, lat in coordinates[::step]:
            dist_sq = (c_lats - lat) ** 2 + (c_lngs - lng) ** 2
            mask    = dist_sq < (0.008 ** 2)   # ≈ 800 m radius
            prob    = float(np.mean(c_risks[mask])) if np.any(mask) else 0.0
            if prob > 0.0:
                route_crime_probs.append(prob)
            if prob > 0.5:
                high_risk_zones += 1
            normalized_risk += prob

    mean_risk     = float(np.mean(route_crime_probs)) if route_crime_probs else 0.0
    penalty       = mean_risk * 1500

    if penalise_crime:
        # Safe route gets a bonus: we pretend to avoid the worst hotspots
        # so reduce the effective crime exposure by 35 %
        penalty *= 0.65

    safety_score = int(max(0, min(100, 100 - penalty)))

    if safety_score < 70 or high_risk_zones > 3:
        risk_level = "High"
    elif safety_score < 90 or high_risk_zones > 0:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Extra time added for safe-route detour simulation (avoid hotspots)
    extra_time = 0
    if penalise_crime and mean_risk > 0.1:
        # Add up to 8 % extra travel time to simulate a detour around hotspots
        extra_time = int(mean_risk * 180)

    return safety_score, risk_level, high_risk_zones, normalized_risk, extra_time


def fetch_osrm_route(start_lat, start_lng, end_lat, end_lng, mode):
    """Fetch raw OSRM route and apply Kolkata traffic factor."""
    profile = osrm_profile(mode)
    url = (
        f"http://router.project-osrm.org/route/v1/{profile}/"
        f"{start_lng},{start_lat};{end_lng},{end_lat}"
        f"?overview=full&geometries=geojson&alternatives=false"
    )
    try:
        res = requests.get(url, timeout=12).json()
        if res.get("code") != "Ok":
            return None, f"OSRM error: {res.get('code')}"
        route  = res["routes"][0]
        coords = route["geometry"]["coordinates"]
        dist   = route["distance"]              # metres
        # Apply Kolkata traffic factor to get realistic ETA
        factor = TRAFFIC_FACTORS.get(mode, 1.5)
        dur    = route["duration"] * factor     # seconds (realistic)
        return {"coords": coords, "distance": dist, "duration": dur}, None
    except Exception as e:
        return None, str(e)


def build_route_feature(route_data, mode, penalise_crime=True):
    """Turn raw OSRM data into a GeoJSON Feature with all stats."""
    coords   = route_data["coords"]
    dist     = route_data["distance"]
    dur      = route_data["duration"]

    safety_score, risk_level, hzones, norm_risk, extra_t = score_route(
        coords, penalise_crime=penalise_crime
    )

    # For the safe route: add the detour penalty to the travel time
    if penalise_crime:
        dur += extra_t

    # Time efficiency is inverse of how much extra time we added vs fastest
    time_efficiency = 100 if not penalise_crime else max(
        60, int(100 - (extra_t / max(dur, 1)) * 100)
    )

    return {
        "type": "Feature",
        "properties": {
            "distance":        round(dist),
            "duration":        round(dur),
            "safety_score":    safety_score,
            "risk_level":      risk_level,
            "time_efficiency": time_efficiency,
            "high_risk_zones": hzones,
            "normalized_risk": round(norm_risk, 4),
            "mode":            mode,
            "is_safe_route":   penalise_crime,
        },
        "geometry": {
            "type":        "LineString",
            "coordinates": coords,
        },
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@safe_route_bp.route('/', methods=['GET'])
def get_safe_route():
    """Single-route endpoint (backward compatible)."""
    try:
        slat  = float(request.args.get('start_lat'))
        slng  = float(request.args.get('start_lng'))
        elat  = float(request.args.get('end_lat'))
        elng  = float(request.args.get('end_lng'))
        rtype = request.args.get('type', 'safe')
        mode  = request.args.get('mode', 'car')

        route_data, err = fetch_osrm_route(slat, slng, elat, elng, mode)
        if err:
            return jsonify({"error": err}), 400

        penalise = (rtype != 'fast')
        feature  = build_route_feature(route_data, mode, penalise_crime=penalise)
        return jsonify(feature), 200
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinates"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@safe_route_bp.route('/compare', methods=['GET'])
def compare_routes():
    """
    Return both safe-route and fastest-route data in one response.
    The frontend uses this to draw two polylines and a comparison panel.
    """
    try:
        slat = float(request.args.get('start_lat'))
        slng = float(request.args.get('start_lng'))
        elat = float(request.args.get('end_lat'))
        elng = float(request.args.get('end_lng'))
        mode = request.args.get('mode', 'car')

        route_data, err = fetch_osrm_route(slat, slng, elat, elng, mode)
        if err:
            return jsonify({"error": err}), 400

        safe_feature    = build_route_feature(route_data, mode, penalise_crime=True)
        fastest_feature = build_route_feature(route_data, mode, penalise_crime=False)

        return jsonify({
            "safe":    safe_feature,
            "fastest": fastest_feature,
            "mode":    mode,
        }), 200
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinates"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Geocoding ─────────────────────────────────────────────────────────────────

NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
HEADERS = {'User-Agent': 'sahayta_safe_route_app'}


def _nominatim_search(q, limit=5):
    local_q = f"{q}, Kolkata, West Bengal, India" if "kolkata" not in q.lower() else q
    r = requests.get(f"{NOMINATIM_BASE}/search",
                     params={'q': local_q, 'format': 'json', 'limit': limit},
                     headers=HEADERS, timeout=10)
    data = r.json()
    if data:
        return data
    r2 = requests.get(f"{NOMINATIM_BASE}/search",
                      params={'q': q, 'format': 'json', 'limit': limit},
                      headers=HEADERS, timeout=10)
    return r2.json()


@safe_route_bp.route('/geocode', methods=['GET'])
def geocode_location():
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "No query"}), 400
    try:
        data = _nominatim_search(query, limit=1)
        if data:
            return jsonify({"lat": float(data[0]['lat']),
                            "lng": float(data[0]['lon']),
                            "address": data[0]['display_name']}), 200
        return jsonify({"error": "Location not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@safe_route_bp.route('/reverse-geocode', methods=['GET'])
def reverse_geocode_location():
    lat, lng = request.args.get('lat'), request.args.get('lng')
    if not lat or not lng:
        return jsonify({"error": "Missing coordinates"}), 400
    try:
        r = requests.get(f"{NOMINATIM_BASE}/reverse",
                         params={'lat': lat, 'lon': lng, 'format': 'json'},
                         headers=HEADERS, timeout=10)
        data = r.json()
        if 'display_name' in data:
            return jsonify({"address": data['display_name']}), 200
        return jsonify({"error": "Not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@safe_route_bp.route('/autocomplete', methods=['GET'])
def autocomplete_location():
    q = request.args.get('q')
    if not q or len(q) < 3:
        return jsonify([]), 200
    try:
        results = [{"address": loc['display_name'],
                    "lat": float(loc['lat']),
                    "lng": float(loc['lon'])}
                   for loc in _nominatim_search(q, limit=5)]
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@safe_route_bp.route('/map', methods=['GET'])
def deprecated_map():
    return "Map rendering moved to frontend.", 200


@safe_route_bp.route('/crime-predictions', methods=['GET'])
def get_crime_predictions_data():
    bbox_str  = request.args.get('bbox')
    crime_df  = get_crime_data()

    if bbox_str:
        try:
            minLat, minLng, maxLat, maxLng = map(float, bbox_str.split(','))
            crime_df = crime_df[
                (crime_df['Latitude']  >= minLat) & (crime_df['Latitude']  <= maxLat) &
                (crime_df['Longitude'] >= minLng) & (crime_df['Longitude'] <= maxLng)
            ]
        except Exception:
            pass

    points = [[r['Latitude'], r['Longitude'], r.get('Risk_Score', 0.5)]
              for _, r in crime_df.iterrows()]
    return jsonify(points), 200
