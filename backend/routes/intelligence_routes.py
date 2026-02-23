
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ml_service import ml_service

intelligence_bp = Blueprint('intelligence', __name__)

@intelligence_bp.route('/predict_crime', methods=['POST'])
@jwt_required()
def predict_crime():
    data = request.json
    try:
        ward = int(data.get('ward'))
        year = int(data.get('year'))
        month = int(data.get('month'))
        
        prediction = ml_service.predict_crime(ward, year, month)
        if prediction is not None:
            return jsonify({'prediction': prediction}), 200
        else:
            return jsonify({'error': 'Prediction failed or model not loaded'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 400

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
