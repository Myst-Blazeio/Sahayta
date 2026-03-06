# safe_route_bp.py
import gc
import os
import requests
import numpy as np
import pandas as pd
from flask import Blueprint, request, jsonify

safe_route_bp = Blueprint('safe_route', __name__)

# ── Module-level caches (populated once, reused forever) ──────────────────────
_crime_lats  = None   # np.ndarray
_crime_lngs  = None
_crime_risks = None
_crime_df_cache = None   # kept only for crime-predictions endpoint

# ── Kolkata urban traffic multipliers ─────────────────────────────────────────
# OSRM returns free-flow times; real Kolkata city speeds are much lower.
TRAFFIC_FACTORS = {
    'car':     1.7,   # ~35 km/h effective (OSRM assumes ~60 km/h)
    'bike':    1.3,   # motorcycle — affected by signals/traffic
    'cycling': 1.2,   # bicycle — largely unaffected by motorised flow
    'walking': 1.1,   # pedestrian — slight delay at crossings
}


def _load_crime_arrays():
    """Load crime data into module-level numpy arrays once."""
    global _crime_lats, _crime_lngs, _crime_risks, _crime_df_cache
    if _crime_lats is not None:
        return True

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    csv_path = os.path.join(base_dir, 'scripts', 'crime_kolkata.csv')

    if not os.path.exists(csv_path):
        return False

    try:
        df = pd.read_csv(csv_path)
        grouped = df.groupby(['Latitude', 'Longitude'])['Crime_Count'].sum().reset_index()
        del df  # free raw DataFrame immediately
        gc.collect()

        maxc = grouped['Crime_Count'].max()
        grouped['Risk_Score'] = grouped['Crime_Count'] / maxc if maxc > 0 else 0.0

        # Keep the full DataFrame for the /crime-predictions endpoint
        _crime_df_cache = grouped

        # Extract only the numpy arrays needed for route scoring
        _crime_lats  = grouped['Latitude'].values.astype(np.float32)
        _crime_lngs  = grouped['Longitude'].values.astype(np.float32)
        _crime_risks = grouped['Risk_Score'].values.astype(np.float32)
        return True
    except Exception as e:
        print(f"[safe_route] Crime data load error: {e}")
        return False


def _compute_safety(mean_risk: float, high_risk: int, penalise: bool):
    """Derive safety score and risk level from mean route crime exposure."""
    penalty = mean_risk * 1500
    if penalise:
        penalty *= 0.65  # safe route avoids the worst zones

    score = int(max(0, min(100, 100 - penalty)))

    if score < 70 or high_risk > 3:
        level = "High"
    elif score < 90 or high_risk > 0:
        level = "Medium"
    else:
        level = "Low"

    extra_time = int(mean_risk * 180) if penalise and mean_risk > 0.1 else 0
    return score, level, extra_time


def score_both_routes(coordinates):
    """
    Single pass through route coordinates to compute crime exposure.
    Returns (safe_stats, fastest_stats) — each a dict with scoring data.
    Avoids allocating crime arrays twice by sharing the module-level cache.
    """
    ok = _load_crime_arrays()

    probs        = []
    high_risk    = 0
    norm_risk    = 0.0

    if ok and _crime_lats is not None and len(_crime_lats) > 0:
        step = max(1, len(coordinates) // 60)

        for lng, lat in coordinates[::step]:
            lat32 = np.float32(lat)
            lng32 = np.float32(lng)
            dist_sq = (_crime_lats - lat32) ** 2 + (_crime_lngs - lng32) ** 2
            mask    = dist_sq < np.float32(6.4e-5)   # (0.008)^2, ≈ 800 m
            if np.any(mask):
                prob = float(_crime_risks[mask].mean())
                probs.append(prob)
                if prob > 0.5:
                    high_risk += 1
                norm_risk += prob

    mean_risk = float(np.mean(probs)) if probs else 0.0

    safe_score,    safe_level,    safe_extra    = _compute_safety(mean_risk, high_risk, True)
    fastest_score, fastest_level, fastest_extra = _compute_safety(mean_risk, high_risk, False)

    return (
        {"score": safe_score,    "level": safe_level,    "hzones": high_risk, "norm": round(norm_risk, 4), "extra": safe_extra},
        {"score": fastest_score, "level": fastest_level, "hzones": high_risk, "norm": round(norm_risk, 4), "extra": 0},
    )


def osrm_profile(mode):
    if mode == 'cycling':
        return 'cycling'
    if mode == 'walking':
        return 'foot'
    return 'driving'   # car + bike both use driving profile


def fetch_osrm_route(slat, slng, elat, elng, mode):
    """Fetch OSRM route and apply Kolkata traffic factor. Frees response immediately."""
    profile = osrm_profile(mode)
    url = (
        f"http://router.project-osrm.org/route/v1/{profile}/"
        f"{slng},{slat};{elng},{elat}"
        f"?overview=full&geometries=geojson&alternatives=false"
    )
    try:
        resp = requests.get(url, timeout=12)
        data = resp.json()
        del resp          # free HTTP response object
        gc.collect()

        if data.get("code") != "Ok":
            return None, f"OSRM error: {data.get('code', 'unknown')}"

        route  = data["routes"][0]
        coords = route["geometry"]["coordinates"]
        dist   = route["distance"]
        dur    = route["duration"] * TRAFFIC_FACTORS.get(mode, 1.5)
        del data          # free full parsed JSON
        return {"coords": coords, "distance": dist, "duration": dur}, None
    except requests.Timeout:
        return None, "Routing service timed out. Please retry."
    except Exception as e:
        return None, str(e)


def build_feature(coords, distance, duration, s, penalise):
    """Assemble a GeoJSON Feature from scoring data."""
    dur_final = round(duration + s["extra"])
    eff       = max(60, int(100 - (s["extra"] / max(dur_final, 1)) * 100)) if penalise else 100
    return {
        "type": "Feature",
        "properties": {
            "distance":        round(distance),
            "duration":        dur_final,
            "safety_score":    s["score"],
            "risk_level":      s["level"],
            "time_efficiency": eff,
            "high_risk_zones": s["hzones"],
            "normalized_risk": s["norm"],
            "is_safe_route":   penalise,
        },
        "geometry": {"type": "LineString", "coordinates": coords},
    }


# ── API Endpoints ─────────────────────────────────────────────────────────────

@safe_route_bp.route('/', methods=['GET'])
def get_safe_route():
    """Single-route endpoint (backward compat)."""
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

        safe_s, fast_s = score_both_routes(route_data["coords"])
        s = safe_s if rtype != 'fast' else fast_s
        feature = build_feature(route_data["coords"], route_data["distance"], route_data["duration"], s, rtype != 'fast')
        return jsonify(feature), 200
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinates"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@safe_route_bp.route('/compare', methods=['GET'])
def compare_routes():
    """
    Return safe + fastest route in one response with realistic ETAs.
    Uses a single OSRM call and a single scoring pass to minimise memory.
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

        # Single numpy pass → scoring data for both variants
        safe_s, fast_s = score_both_routes(route_data["coords"])

        safe_feat    = build_feature(route_data["coords"], route_data["distance"], route_data["duration"], safe_s,  True)
        fastest_feat = build_feature(route_data["coords"], route_data["distance"], route_data["duration"], fast_s,  False)

        return jsonify({"safe": safe_feat, "fastest": fastest_feat, "mode": mode}), 200
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinates"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Geocoding (Nominatim) ─────────────────────────────────────────────────────

NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
_HEADERS = {'User-Agent': 'sahayta_safe_route_app'}


def _nom_search(q, limit=5):
    local_q = f"{q}, Kolkata, West Bengal, India" if "kolkata" not in q.lower() else q
    try:
        r = requests.get(f"{NOMINATIM_BASE}/search",
                         params={'q': local_q, 'format': 'json', 'limit': limit},
                         headers=_HEADERS, timeout=10)
        data = r.json()
        del r
        if data:
            return data
    except Exception:
        pass
    try:
        r2 = requests.get(f"{NOMINATIM_BASE}/search",
                          params={'q': q, 'format': 'json', 'limit': limit},
                          headers=_HEADERS, timeout=10)
        data = r2.json()
        del r2
        return data
    except Exception:
        return []


@safe_route_bp.route('/geocode', methods=['GET'])
def geocode_location():
    q = request.args.get('q')
    if not q:
        return jsonify({"error": "No query"}), 400
    try:
        data = _nom_search(q, limit=1)
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
        return jsonify({"error": "Missing coords"}), 400
    try:
        r = requests.get(f"{NOMINATIM_BASE}/reverse",
                         params={'lat': lat, 'lon': lng, 'format': 'json'},
                         headers=_HEADERS, timeout=10)
        data = r.json()
        del r
        if 'display_name' in data:
            return jsonify({"address": data['display_name']}), 200
        return jsonify({"error": "Not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@safe_route_bp.route('/autocomplete', methods=['GET'])
def autocomplete_location():
    q = request.args.get('q', '')
    if len(q) < 3:
        return jsonify([]), 200
    try:
        results = [{"address": loc['display_name'],
                    "lat": float(loc['lat']),
                    "lng": float(loc['lon'])}
                   for loc in _nom_search(q, limit=5)]
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@safe_route_bp.route('/map', methods=['GET'])
def deprecated_map():
    return "Map rendering moved to frontend.", 200


@safe_route_bp.route('/crime-predictions', methods=['GET'])
def get_crime_predictions_data():
    _load_crime_arrays()
    crime_df = _crime_df_cache

    if crime_df is None or crime_df.empty:
        return jsonify([]), 200

    bbox_str = request.args.get('bbox')
    if bbox_str:
        try:
            minLat, minLng, maxLat, maxLng = map(float, bbox_str.split(','))
            crime_df = crime_df[
                (crime_df['Latitude']  >= minLat) & (crime_df['Latitude']  <= maxLat) &
                (crime_df['Longitude'] >= minLng) & (crime_df['Longitude'] <= maxLng)
            ]
        except Exception:
            pass

    points = [[row['Latitude'], row['Longitude'], row.get('Risk_Score', 0.5)]
              for _, row in crime_df.iterrows()]
    return jsonify(points), 200
