import pandas as pd
import numpy as np
import re
import joblib
import os
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import SnowballStemmer
import pymongo
from dotenv import load_dotenv
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ml_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Descargar recursos de NLTK
def download_nltk_resources():
    resources = {
        'punkt': 'tokenizers/punkt',
        'stopwords': 'corpora/stopwords'
    }
    
    for resource, path in resources.items():
        try:
            nltk.data.find(path)
            logger.info(f"✅ Recurso NLTK '{resource}' ya está disponible")
        except LookupError:
            logger.info(f"📥 Descargando recurso NLTK: {resource}")
            nltk.download(resource, quiet=True)

download_nltk_resources()

load_dotenv()

class AdvancedUrgencyClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1500,
            stop_words=stopwords.words('spanish'),
            ngram_range=(1, 3),
            min_df=2,
            max_df=0.85,
            strip_accents='unicode'
        )
        self.classifier = RandomForestClassifier(
            n_estimators=150,
            random_state=42,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight='balanced'
        )
        self.stemmer = SnowballStemmer('spanish')
        
        # Diccionario expandido de palabras clave
        self.urgency_keywords = {
            'critico': [
                'urgente', 'emergencia', 'inmediato', 'grave', 'peligro', 
                'riesgo', 'crítico', 'vida', 'salud', 'accidente',
                'incendio', 'inundación', 'derrumbe', 'contaminación',
                'delito', 'violencia', 'amenaza', 'pánico', 'desastre',
                'evacuación', 'rescate', 'ambulancia', 'bomberos', 'policía',
                'sangre', 'herido', 'muerto', 'hospital', 'clínica'
            ],
            'alto': [
                'importante', 'necesario', 'prioritario', 'atencion',
                'solicito', 'requiero', 'necesito', 'favor', 'rapido',
                'pronto', 'inmediatamente', 'cuanto antes', 'lo antes posible',
                'dificil', 'complicado', 'problema grave', 'serio'
            ],
            'medio': [
                'consultar', 'información', 'duda', 'pregunta',
                'interés', 'posibilidad', 'futuro', 'sugerencia',
                'mejora', 'propuesta', 'idea', 'recomendación'
            ],
            'bajo': [
                'rutina', 'normal', 'habitual', 'regular',
                'programado', 'planificado', 'cuando pueda'
            ]
        }
        
        self.model_info = {
            'version': '1.2.0',
            'trained_at': None,
            'accuracy': 0.0,
            'features_used': 0
        }
        
    def advanced_preprocess_text(self, text):
        """Preprocesamiento avanzado de texto"""
        if not isinstance(text, str):
            return ""
            
        # Limpieza avanzada
        text = text.lower()
        
        # Remover caracteres especiales pero mantener acentos
        text = re.sub(r'[^\w\sáéíóúñ]', '', text)
        
        # Remover números
        text = re.sub(r'\d+', '', text)
        
        # Remover espacios extra
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Tokenización
        tokens = word_tokenize(text)
        
        # Eliminar stopwords y aplicar stemming
        stop_words = set(stopwords.words('spanish'))
        tokens = [self.stemmer.stem(token) for token in tokens if token not in stop_words and len(token) > 2]
        
        return ' '.join(tokens)
    
    def extract_advanced_features(self, text):
        """Extraer características avanzadas del texto"""
        original_text = text
        processed_text = self.advanced_preprocess_text(text)
        
        # Contar palabras clave por nivel (en texto original)
        keyword_counts = {level: 0 for level in ['critico', 'alto', 'medio', 'bajo']}
        for level, keywords in self.urgency_keywords.items():
            for keyword in keywords:
                if keyword in original_text.lower():
                    keyword_counts[level] += 1
        
        # Características de texto
        text_length = len(original_text)
        word_count = len(original_text.split())
        
        # Características emocionales
        exclamation_count = original_text.count('!')
        question_count = original_text.count('?')
        capital_words = len([word for word in original_text.split() if word.isupper() and len(word) > 1])
        
        # Palabras de urgencia específicas
        has_emergency = 1 if any(word in original_text.lower() for word in self.urgency_keywords['critico']) else 0
        has_high_urgency = 1 if any(word in original_text.lower() for word in self.urgency_keywords['alto']) else 0
        
        # Calcular scores ponderados
        keyword_score = (
            keyword_counts['critico'] * 10 +
            keyword_counts['alto'] * 5 +
            keyword_counts['medio'] * 2 +
            keyword_counts['bajo'] * 0.5
        )
        
        # Features finales
        features = {
            'text_length': text_length,
            'word_count': word_count,
            'exclamation_count': min(exclamation_count, 10),  # Cap at 10
            'question_count': min(question_count, 5),         # Cap at 5
            'capital_words': capital_words,
            'has_emergency': has_emergency,
            'has_high_urgency': has_high_urgency,
            'keyword_score_critico': keyword_counts['critico'],
            'keyword_score_alto': keyword_counts['alto'],
            'keyword_score_medio': keyword_counts['medio'],
            'keyword_score_bajo': keyword_counts['bajo'],
            'total_keyword_score': keyword_score,
            'urgency_density': keyword_score / max(word_count, 1)
        }
        
        return features
    
    def calculate_urgency_score(self, features):
        """Calcular puntuación de urgencia avanzada"""
        score = (
            features['keyword_score_critico'] * 15 +
            features['keyword_score_alto'] * 8 +
            features['keyword_score_medio'] * 3 +
            features['has_emergency'] * 25 +
            features['has_high_urgency'] * 15 +
            min(features['exclamation_count'] * 4, 20) +
            min(features['capital_words'] * 3, 15) +
            (features['urgency_density'] * 100)
        )
        
        # Normalizar a 0-100
        return min(max(score, 0), 100)
    
    def train(self, texts, labels, test_size=0.2):
        """Entrenar el modelo con validación"""
        logger.info("🔧 Iniciando entrenamiento del modelo de urgencia...")
        
        if len(texts) != len(labels):
            raise ValueError("El número de textos y etiquetas debe ser igual")
        
        # Extraer características
        features_list = []
        for i, text in enumerate(texts):
            features = self.extract_advanced_features(text)
            features_list.append(list(features.values()))
            
            if (i + 1) % 100 == 0:
                logger.info(f"📊 Procesados {i + 1}/{len(texts)} textos")
        
        X = np.array(features_list)
        y = np.array(labels)
        
        # Dividir datos
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        logger.info(f"📈 Conjunto de entrenamiento: {X_train.shape[0]} muestras")
        logger.info(f"📊 Conjunto de prueba: {X_test.shape[0]} muestras")
        
        # Entrenar modelo
        self.classifier.fit(X_train, y_train)
        
        # Evaluar
        y_pred = self.classifier.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Actualizar info del modelo
        self.model_info.update({
            'trained_at': pd.Timestamp.now().isoformat(),
            'accuracy': float(accuracy),
            'features_used': X.shape[1],
            'training_samples': len(texts),
            'test_samples': len(X_test)
        })
        
        logger.info(f"✅ Modelo entrenado - Precisión: {accuracy:.4f}")
        logger.info("📋 Reporte de clasificación:")
        logger.info(f"\n{classification_report(y_test, y_pred)}")
        
        # Matriz de confusión
        cm = confusion_matrix(y_test, y_pred)
        logger.info(f"🎯 Matriz de confusión:\n{cm}")
        
        return accuracy
    
    def predict_urgency(self, text):
        """Predecir urgencia de un texto con confianza"""
        try:
            features = self.extract_advanced_features(text)
            feature_vector = np.array([list(features.values())])
            
            # Predecir con el modelo
            prediction = self.classifier.predict(feature_vector)[0]
            probabilities = self.classifier.predict_proba(feature_vector)[0]
            
            # Calcular puntuación de urgencia
            urgency_score = self.calculate_urgency_score(features)
            
            # Determinar nivel de prioridad basado en score y predicción
            if urgency_score >= 80 or prediction == 3:
                priority = 'URGENTE'
                nivel = 'CRITICO'
            elif urgency_score >= 60 or prediction == 2:
                priority = 'ALTA'
                nivel = 'ALTO'
            elif urgency_score >= 30 or prediction == 1:
                priority = 'MEDIA'
                nivel = 'MEDIO'
            else:
                priority = 'BAJA'
                nivel = 'BAJO'
            
            # Extraer palabras clave encontradas
            found_keywords = []
            for level, keywords in self.urgency_keywords.items():
                for keyword in keywords:
                    if keyword in text.lower():
                        found_keywords.append({
                            'palabra': keyword,
                            'nivel': level.upper(),
                            'puntaje': {
                                'critico': 15,
                                'alto': 8,
                                'medio': 3,
                                'bajo': 0.5
                            }[level]
                        })
            
            # Calcular confianza basada en probabilidades y características
            confidence = max(probabilities)
            feature_confidence = min(urgency_score / 100, 1.0)
            final_confidence = (confidence + feature_confidence) / 2
            
            return {
                'success': True,
                'priority': priority,
                'nivel': nivel,
                'urgency_score': round(urgency_score, 2),
                'found_keywords': found_keywords,
                'confidence': round(final_confidence, 4),
                'features_used': len(features),
                'keyword_count': len(found_keywords),
                'model_version': self.model_info['version']
            }
            
        except Exception as e:
            logger.error(f"❌ Error en predicción: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'priority': 'MEDIA',
                'urgency_score': 0,
                'confidence': 0
            }
    
    def save_model(self, path='models/'):
        """Guardar modelo entrenado"""
        os.makedirs(path, exist_ok=True)
        
        model_data = {
            'vectorizer': self.vectorizer,
            'classifier': self.classifier,
            'model_info': self.model_info,
            'urgency_keywords': self.urgency_keywords
        }
        
        model_path = os.path.join(path, 'urgency_model.joblib')
        joblib.dump(model_data, model_path)
        
        # Guardar info del modelo como JSON
        info_path = os.path.join(path, 'model_info.json')
        with open(info_path, 'w', encoding='utf-8') as f:
            json.dump(self.model_info, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Modelo guardado en {model_path}")
        logger.info(f"📋 Información del modelo: {self.model_info}")
    
    def load_model(self, path='models/urgency_model.joblib'):
        """Cargar modelo entrenado"""
        if os.path.exists(path):
            try:
                model_data = joblib.load(path)
                self.vectorizer = model_data['vectorizer']
                self.classifier = model_data['classifier']
                self.model_info = model_data.get('model_info', {})
                self.urgency_keywords = model_data.get('urgency_keywords', {})
                
                logger.info("📂 Modelo cargado exitosamente")
                logger.info(f"🔍 Modelo info: {self.model_info}")
                return True
            except Exception as e:
                logger.error(f"❌ Error cargando modelo: {str(e)}")
                return False
        else:
            logger.warning("⚠️ No se encontró modelo pre-entrenado")
            return False

def generate_comprehensive_training_data():
    """Generar datos de entrenamiento comprehensivos"""
    logger.info("📚 Generando datos de entrenamiento...")
    
    training_data = []
    
    # Textos de URGENCIA CRÍTICA (label: 3)
    critical_urgency_texts = [
        "URGENTE: Incendio en mi vivienda, necesito ayuda inmediata de bomberos",
        "EMERGENCIA: Inundación en el distrito de Amarilis, riesgo para la población",
        "PELIGRO: Derrumbe en la carretera principal, vidas en riesgo!!!",
        "ACCIDENTE: Choque automovilístico con heridos graves, necesito ambulancia",
        "CRÍTICO: Contaminación del agua potable, riesgo de salud pública",
        "URGENTE: Persona desaparecida, necesito ayuda de inmediato",
        "EMERGENCIA: Fuga de gas, peligro de explosión en todo el edificio",
        "GRAVE: Violencia familiar extrema, necesito protección urgente",
        "DESASTRE: Deslizamiento de tierra, familias atrapadas!!!",
        "SOS: Niño perdido en el cerro, necesito rescate inmediato",
        "AMBULANCIA: Infarto cardiaco, necesito ayuda médica URGENTE",
        "BOMBEROS: Incendio forestal se acerca a viviendas!!!",
        "PELIGRO: Cables de alta tensión caídos, riesgo de electrocución",
        "EMERGENCIA MÉDICA: Mujer en trabajo de parto complicado",
        "AUXILIO: Persona intentando suicidar desde edificio alto"
    ]
    
    # Textos de ALTA urgencia (label: 2)
    high_urgency_texts = [
        "Necesito una licencia de funcionamiento URGENTE para mi negocio",
        "Es MUY IMPORTANTE que revisen mi solicitud de construcción inmediatamente",
        "Requiero atención PRIORITARIA para mi trámite de manera URGENTE",
        "Solicito información URGENTE sobre mi documento de identidad",
        "Necesito resolver este problema GRAVE rápidamente",
        "Es PRIORITARIO para mi negocio esta autorización INMEDIATA",
        "Problema SERIO con el suministro de agua, necesito solución YA",
        "Fuga de agua PRINCIPAL, riesgo de inundación en la zona",
        "Corte de luz HOSPITAL, necesito restablecimiento INMEDIATO",
        "Contaminación AMBIENTAL grave, necesito inspección URGENTE"
    ]
    
    # Textos de MEDIA urgencia (label: 1)
    medium_urgency_texts = [
        "Necesito una licencia de funcionamiento para mi nuevo negocio",
        "Solicito permiso de construcción para mi vivienda",
        "Requiero una partida de nacimiento para trámites escolares",
        "Necesito constancia de vecindad para realizar mis trámites",
        "Solicito información sobre los requisitos para licencia",
        "Quiero hacer un reclamo sobre el servicio de limpieza pública",
        "Necesito autorización para realizar un evento comunitario",
        "Solicito revisión de arbitrios municipales",
        "Requiero información sobre permisos para negocio",
        "Necesito asesoramiento para trámite de construcción"
    ]
    
    # Textos de BAJA urgencia (label: 0)
    low_urgency_texts = [
        "Consulta sobre requisitos para licencia de funcionamiento",
        "Información general sobre trámites municipales disponibles",
        "Duda sobre horarios de atención al público en municipalidad",
        "Pregunta sobre documentos necesarios para constancia",
        "Solicito información sobre tarifas municipales vigentes",
        "Consulta sobre proceso para apertura de negocio",
        "Información sobre programas sociales del municipio",
        "Duda sobre fechas de pago de arbitrios",
        "Consulta sobre requisitos para eventos públicos",
        "Información sobre servicios municipales disponibles"
    ]
    
    # Agregar datos de entrenamiento
    for text in critical_urgency_texts:
        training_data.append({'text': text, 'label': 3, 'level': 'CRITICO'})
    
    for text in high_urgency_texts:
        training_data.append({'text': text, 'label': 2, 'level': 'ALTO'})
    
    for text in medium_urgency_texts:
        training_data.append({'text': text, 'label': 1, 'level': 'MEDIO'})
    
    for text in low_urgency_texts:
        training_data.append({'text': text, 'label': 0, 'level': 'BAJO'})
    
    logger.info(f"📊 Datos de entrenamiento generados: {len(training_data)} muestras")
    logger.info(f"📈 Distribución: CRITICO({len(critical_urgency_texts)}) | ALTO({len(high_urgency_texts)}) | MEDIO({len(medium_urgency_texts)}) | BAJO({len(low_urgency_texts)})")
    
    return training_data

def main():
    """Función principal de entrenamiento"""
    logger.info("🤖 Iniciando proceso completo de entrenamiento ML...")
    
    try:
        # Generar datos de entrenamiento
        training_data = generate_comprehensive_training_data()
        texts = [item['text'] for item in training_data]
        labels = [item['label'] for item in training_data]
        
        # Crear y entrenar clasificador
        classifier = AdvancedUrgencyClassifier()
        accuracy = classifier.train(texts, labels)
        
        # Guardar modelo
        classifier.save_model('models/')
        
        # Probar predicciones de ejemplo
        test_texts = [
            "URGENTE: incendio en mi casa necesito bomberos ya!",
            "Necesito una licencia de funcionamiento por favor",
            "Consulta sobre documentos para matrimonio civil",
            "EMERGENCIA: accidente de tránsito con heridos graves!!!",
            "Solicito información sobre pago de arbitrios"
        ]
        
        logger.info("\n🧪 Probando predicciones con modelo entrenado:")
        for text in test_texts:
            prediction = classifier.predict_urgency(text)
            if prediction['success']:
                logger.info(f"📝 Texto: '{text}'")
                logger.info(f"🎯 Predicción: {prediction['priority']} (Score: {prediction['urgency_score']})")
                logger.info(f"🔍 Confianza: {prediction['confidence']:.2%}")
                logger.info(f"🏷️  Palabras clave: {[p['palabra'] for p in prediction['found_keywords']]}")
                logger.info("---")
        
        logger.info("✅ Entrenamiento completado exitosamente!")
        
    except Exception as e:
        logger.error(f"❌ Error en el entrenamiento: {str(e)}")
        raise

if __name__ == "__main__":
    main()