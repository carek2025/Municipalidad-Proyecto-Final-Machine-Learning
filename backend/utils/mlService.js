import axios from 'axios'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001'

class MLService {
  constructor() {
    this.baseURL = ML_SERVICE_URL
    this.timeout = 10000 // 10 segundos
  }

  async analizarUrgencia(texto) {
    try {
      const response = await axios.post(`${this.baseURL}/predict/urgency`, {
        text: texto
      }, {
        timeout: this.timeout
      })
      
      const data = response.data
      
      if (data.success) {
        // Mapear la respuesta del servicio ML a la estructura esperada por el backend
        return {
          priority: data.priority, // 'URGENTE'
          urgency_score: data.urgency_score, // 100
          found_keywords: data.found_keywords ? data.found_keywords.map(kw => kw.palabra) : [], // Extraer las palabras
          confidence: data.confidence,
          // Podemos mantener otros campos si son necesarios
          nivel: data.nivel,
          model_version: data.model_version
        }
      } else {
        console.warn('ML Service returned error, using fallback:', data.error)
        return this.fallbackAnalysis(texto)
      }
    } catch (error) {
      console.error('Error calling ML service:', error.message)
      return this.fallbackAnalysis(texto)
    }
  }


  fallbackAnalysis(texto) {
    const palabrasUrgentes = [
      'urgente', 'emergencia', 'inmediato', 'grave', 'peligro', 
      'riesgo', 'crítico', 'vida', 'salud', 'accidente',
      'incendio', 'inundación', 'derrumbe', 'contaminación'
    ]
    
    const palabrasAltas = [
      'importante', 'necesario', 'prioritario', 'atencion',
      'solicito', 'requiero', 'necesito', 'favor', 'rapido'
    ]

    const textoLower = texto.toLowerCase()
    
    let puntuacion = 0
    const palabrasEncontradas = []
    
    // Contar palabras urgentes
    palabrasUrgentes.forEach(palabra => {
      if (textoLower.includes(palabra)) {
        puntuacion += 10
        palabrasEncontradas.push(palabra)
      }
    })

    // Contar palabras de alta prioridad
    palabrasAltas.forEach(palabra => {
      if (textoLower.includes(palabra)) {
        puntuacion += 5
        palabrasEncontradas.push(palabra)
      }
    })
    
    // Aumentar puntuación por signos de exclamación
    const exclamaciones = (texto.match(/!/g) || []).length
    puntuacion += exclamaciones * 3
    
    // Aumentar por palabras en mayúsculas
    const palabrasMayusculas = (texto.match(/\b[A-Z]{2,}\b/g) || []).length
    puntuacion += palabrasMayusculas * 2

    // Determinar prioridad
    let prioridad = 'MEDIA'
    if (puntuacion >= 25) {
      prioridad = 'URGENTE'
    } else if (puntuacion >= 15) {
      prioridad = 'ALTA'
    } else if (puntuacion <= 5) {
      prioridad = 'BAJA'
    }
    
    return {
      priority: prioridad,
      urgency_score: Math.min(puntuacion, 100),
      found_keywords: [...new Set(palabrasEncontradas)], // Eliminar duplicados
      confidence: 0.7,
      fallback: true
    }
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      })
      return {
        healthy: true,
        data: response.data
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      }
    }
  }
}

export const mlService = new MLService()
