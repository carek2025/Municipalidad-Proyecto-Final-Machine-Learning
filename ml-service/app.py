from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from model_training import AdvancedUrgencyClassifier
import os
from dotenv import load_dotenv
import logging
import sys
from datetime import datetime

# Configurar logging para producción
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/municipalidad/ml_service.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app)

# Variables globales
classifier = None
model_loaded = False

def load_ml_model():
    """Cargar modelo ML al iniciar la aplicación"""
    global classifier, model_loaded
    
    try:
        classifier = AdvancedUrgencyClassifier()
        
        # Intentar cargar modelo entrenado
        model_path = os.getenv('ML_MODEL_PATH', 'models/urgency_model.joblib')
        model_loaded = classifier.load_model(model_path)
        
        if model_loaded:
            logger.info("✅ Modelo ML cargado exitosamente")
        else:
            logger.warning("⚠️ No se pudo cargar modelo pre-entrenado, usando clasificador básico")
            
    except Exception as e:
        logger.error(f"❌ Error cargando modelo ML: {str(e)}")
        model_loaded = False

# Cargar modelo al inicio
load_ml_model()

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de salud del servicio"""
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': model_loaded,
        'service': 'ML Urgency Classifier',
        'version': '2.0.0'
    }
    
    if classifier and classifier.model_info:
        health_status['model_info'] = classifier.model_info
    
    return jsonify(health_status)

@app.route('/predict/urgency', methods=['POST'])
def predict_urgency():
    """Endpoint para predecir urgencia de un texto"""
    try:
        start_time = datetime.now()
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Datos JSON requeridos'
            }), 400
        
        text = data.get('text', '')
        if not text:
            return jsonify({
                'success': False,
                'error': 'Texto requerido'
            }), 400
        
        logger.info(f"🔍 Analizando urgencia para texto: {text[:100]}...")
        
        # Realizar predicción
        if model_loaded and classifier:
            prediction = classifier.predict_urgency(text)
        else:
            # Fallback básico si el modelo no está cargado
            prediction = {
                'success': True,
                'priority': 'MEDIA',
                'nivel': 'MEDIO',
                'urgency_score': 25.0,
                'found_keywords': [],
                'confidence': 0.5,
                'features_used': 0,
                'keyword_count': 0,
                'model_version': 'fallback-1.0',
                'fallback': True
            }
        
        # Calcular tiempo de procesamiento
        processing_time = (datetime.now() - start_time).total_seconds()
        prediction['processing_time_seconds'] = round(processing_time, 4)
        
        logger.info(f"✅ Predicción completada: {prediction['priority']} (Score: {prediction['urgency_score']})")
        
        return jsonify(prediction)
        
    except Exception as e:
        logger.error(f"❌ Error en predicción de urgencia: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}'
        }), 500

@app.route('/batch/predict', methods=['POST'])
def batch_predict():
    """Endpoint para predicciones por lote"""
    try:
        start_time = datetime.now()
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Datos JSON requeridos'}), 400
        
        texts = data.get('texts', [])
        if not texts or not isinstance(texts, list):
            return jsonify({'error': 'Lista de textos requerida'}), 400
        
        if len(texts) > 100:
            return jsonify({'error': 'Máximo 100 textos por lote'}), 400
        
        logger.info(f"🔍 Procesando lote de {len(texts)} textos...")
        
        # Realizar predicciones por lote
        predictions = []
        for i, text in enumerate(texts):
            if model_loaded and classifier:
                prediction = classifier.predict_urgency(text)
            else:
                prediction = {
                    'success': True,
                    'priority': 'MEDIA',
                    'urgency_score': 25.0,
                    'confidence': 0.5,
                    'fallback': True
                }
            
            predictions.append({
                'text': text,
                'prediction': prediction
            })
            
            if (i + 1) % 10 == 0:
                logger.info(f"📊 Procesados {i + 1}/{len(texts)} textos")
        
        # Estadísticas del lote
        total_time = (datetime.now() - start_time).total_seconds()
        priorities = [p['prediction']['priority'] for p in predictions]
        
        stats = {
            'total_processed': len(predictions),
            'processing_time_seconds': round(total_time, 4),
            'avg_time_per_text': round(total_time / len(texts), 4),
            'priority_distribution': {
                'URGENTE': priorities.count('URGENTE'),
                'ALTA': priorities.count('ALTA'),
                'MEDIA': priorities.count('MEDIA'),
                'BAJA': priorities.count('BAJA')
            }
        }
        
        logger.info(f"✅ Lote procesado: {stats}")
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'statistics': stats
        })
        
    except Exception as e:
        logger.error(f"❌ Error en procesamiento por lote: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}'
        }), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Endpoint para obtener información del modelo"""
    if model_loaded and classifier:
        return jsonify({
            'success': True,
            'model_loaded': True,
            'model_info': classifier.model_info
        })
    else:
        return jsonify({
            'success': False,
            'model_loaded': False,
            'message': 'Modelo no cargado'
        })

@app.route('/model/retrain', methods=['POST'])
def retrain_model():
    """Endpoint para re-entrenar el modelo (solo en desarrollo)"""
    if os.getenv('NODE_ENV') == 'production':
        return jsonify({
            'success': False,
            'error': 'Re-entrenamiento no permitido en producción'
        }), 403
    
    try:
        from model_training import main as train_main
        train_main()
        
        # Recargar modelo
        load_ml_model()
        
        return jsonify({
            'success': True,
            'message': 'Modelo re-entrenado y recargado exitosamente'
        })
        
    except Exception as e:
        logger.error(f"❌ Error en re-entrenamiento: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error en re-entrenamiento: {str(e)}'
        }), 500

# Manejo de errores global
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"❌ Error interno del servidor: {error}")
    return jsonify({'error': 'Error interno del servidor'}), 500

if __name__ == '__main__':
    port = int(os.getenv('ML_SERVICE_PORT', 5001))
    host = os.getenv('ML_SERVICE_HOST', '0.0.0.0')
    
    logger.info(f"🚀 Iniciando servicio ML en {host}:{port}")
    logger.info(f"🔧 Modelo cargado: {model_loaded}")
    
    # Para producción usar: gunicorn -w 4 -b 0.0.0.0:5001 app:app
    app.run(host=host, port=port, debug=False)