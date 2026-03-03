
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ml_service import ml_service
from db import get_db

intelligence_bp = Blueprint('intelligence', __name__)


# ── Crime prediction ──────────────────────────────────────────────────────────

@intelligence_bp.route('/predict_crime', methods=['POST'])
@jwt_required()
def predict_crime():
    data = request.json
    try:
        ward  = int(data.get('ward'))
        year  = int(data.get('year'))
        month = int(data.get('month'))
        prediction = ml_service.predict_crime(ward, year, month)
        if prediction is not None:
            return jsonify({'prediction': prediction}), 200
        return jsonify({'error': 'Prediction failed or model not loaded'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ── BNS AI suggestions ────────────────────────────────────────────────────────

@intelligence_bp.route('/predict_bns', methods=['POST'])
@jwt_required()
def predict_bns():
    data = request.json
    try:
        query = data.get('query')
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        results = ml_service.predict_bns(query)
        return jsonify({'results': results}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ── BNS Database ──────────────────────────────────────────────────────────────

def _serialize(doc) -> dict:
    """Convert a MongoDB document to a JSON-safe dict."""
    doc.pop('_id', None)
    doc.pop('searchable', None)   # internal field — don't expose
    return doc


@intelligence_bp.route('/bns-sections', methods=['GET'])
@jwt_required()
def list_bns_sections():
    """
    GET /api/intelligence/bns-sections
    Returns all BNS sections (summary view — no full description).
    Optional query param: ?search=<term>  (MongoDB text search)
    """
    try:
        db  = get_db()
        col = db['bns_sections']

        search_term = request.args.get('search', '').strip()

        if search_term:
            cursor = col.find(
                {'$text': {'$search': search_term}},
                {'score': {'$meta': 'textScore'}, 'description': 0}
            ).sort([('score', {'$meta': 'textScore'})]).limit(20)
        else:
            cursor = col.find({}, {'description': 0}).sort('section_num', 1)

        sections = [_serialize(doc) for doc in cursor]
        return jsonify({'sections': sections, 'total': len(sections)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@intelligence_bp.route('/bns-sections/<section_id>', methods=['GET'])
@jwt_required()
def get_bns_section(section_id: str):
    """
    GET /api/intelligence/bns-sections/BNS_103
    Returns the full document for a single BNS section (including legal text).
    """
    try:
        db  = get_db()
        col = db['bns_sections']

        # Accept both BNS_103 and 103
        if not section_id.startswith('BNS_'):
            section_id = f'BNS_{section_id}'

        doc = col.find_one({'section_id': section_id.upper()})
        if not doc:
            return jsonify({'error': f'Section {section_id} not found'}), 404

        return jsonify({'section': _serialize(doc)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@intelligence_bp.route('/bns-sections/search', methods=['POST'])
@jwt_required()
def search_bns_sections():
    """
    POST /api/intelligence/bns-sections/search
    Body: { "query": "theft robbery snatching", "limit": 10 }
    Full BM25 AI search — same as predict_bns but returns structured DB documents.
    """
    try:
        data   = request.json or {}
        query  = data.get('query', '').strip()
        k      = int(data.get('limit', 5))

        if not query:
            return jsonify({'error': 'query is required'}), 400

        # Get BM25 suggestions (rank + section info from pkl)
        suggestions = ml_service.predict_bns(query, k=k)

        # Enrich with full MongoDB document data
        db  = get_db()
        col = db['bns_sections']

        enriched = []
        for s in suggestions:
            sec_id = s.get('Section') or s.get('section', '')
            if not sec_id:
                continue
            doc = col.find_one({'section_id': sec_id})
            result = _serialize(doc) if doc else {}
            result['rank']       = s.get('rank')
            result['similarity'] = s.get('similarity')
            enriched.append(result)

        return jsonify({'results': enriched, 'total': len(enriched)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
