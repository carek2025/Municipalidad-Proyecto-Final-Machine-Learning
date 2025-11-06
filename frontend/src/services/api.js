import axios from 'axios'

// Configuración base de axios para producción
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://municipal.huancacode.com/api'
const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'https://municipal.huancacode.com/ml-api'

// Crear instancia de axios para API principal
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Crear instancia para ML API
const mlApi = axios.create({
  baseURL: ML_API_URL,
  timeout: 15000,
})

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('municipalidad_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('municipalidad_token')
      window.location.href = '/login'
    }
    
    // Manejar errores de red
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      console.error('Error de conexión:', error)
      // Podrías mostrar una notificación al usuario aquí
    }
    
    return Promise.reject(error)
  }
)
// Servicios de Autenticación
export const authAPI = {
  login: (dni, password) => 
    api.post('/auth/login', { dni, password }).then(res => res.data),
  
  register: (userData) => 
    api.post('/auth/register', userData).then(res => res.data),
  
  verifyToken: () => 
    api.get('/auth/profile').then(res => res.data.user),
  
  updateProfile: (profileData) => 
    api.put('/auth/profile', profileData).then(res => res.data),
  
  changePassword: (passwordData) => 
    api.put('/auth/change-password', passwordData).then(res => res.data)
}

// Servicios de Trámites
export const tramitesAPI = {
  create: (tramiteData) => 
    api.post('/tramites', tramiteData).then(res => res.data),
  
  getAll: (params = {}) => 
    api.get('/tramites', { params }).then(res => res.data),
  
  getById: (id) => 
    api.get(`/tramites/${id}`).then(res => res.data),
  
  updateEstado: (id, estadoData) => 
    api.put(`/tramites/${id}/estado`, estadoData).then(res => res.data),
  
  asignarFuncionario: (id, funcionarioId) => 
    api.put(`/tramites/${id}/asignar`, { funcionarioId }).then(res => res.data),
  
  getTipos: () => 
    api.get('/tramites/tipos').then(res => res.data),
  
  subirDocumentos: (id, formData) => 
    api.post(`/tramites/${id}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data)
}

// Servicios de Alertas
export const alertasAPI = {
  getAll: (params = {}) => 
    api.get('/alertas', { params }).then(res => res.data),
  
  getById: (id) => 
    api.get(`/alertas/${id}`).then(res => res.data),
  
  marcarLeida: (id) => 
    api.put(`/alertas/${id}/leida`).then(res => res.data),
  
  getEstadisticas: () => 
    api.get('/alertas/estadisticas').then(res => res.data),
  
  crearAlerta: (alertaData) => 
    api.post('/alertas', alertaData).then(res => res.data),

  resolverAlerta: (alertaId, observaciones) => 
    api.put(`/alertas/${alertaId}/resolver`, { observaciones }).then(res => res.data)
}

// Servicios de Dashboard
export const dashboardAPI = {
  getEstadisticas: () => 
    api.get('/dashboard/estadisticas').then(res => res.data),
  
  getMetricasTiempoReal: () => 
    api.get('/dashboard/metricas-tiempo-real').then(res => res.data),
  
  getTramitesRecientes: (limit = 10) => 
    api.get('/dashboard/tramites-recientes', { params: { limit } }).then(res => res.data),
  
  getAlertasUrgentes: () => 
    api.get('/dashboard/alertas-urgentes').then(res => res.data),

  getDistribucionAreas: () => 
    api.get('/dashboard/distribucion-areas').then(res => res.data)
}
// Servicios de Reportes y PDF
export const reportesAPI = {
  generarPDF: (tramiteId, options = {}) => 
    api.post('/pdf/generar', { tramiteId, ...options }).then(res => res.data),
  
  generarReporteEstadistico: (params = {}) => 
    api.post('/pdf/reporte-estadistico', params).then(res => res.data),
  
  descargarPDF: (tramiteId) => 
    api.get(`/pdf/descargar/${tramiteId}`, { responseType: 'blob' }).then(res => res.data),
  
  generarMultiplesPDFs: (tramitesIds) => 
    api.post('/pdf/generar-multiples', { tramitesIds }).then(res => res.data)
}

// Servicios de Machine Learning
export const mlService = {
  predecirUrgencia: (texto) => 
    mlApi.post('/predict/urgency', { text: texto }).then(res => res.data),
  
  predecirLote: (textos) => 
    mlApi.post('/batch/predict', { texts: textos }).then(res => res.data),
  
  getInfoModelo: () => 
    mlApi.get('/model/info').then(res => res.data),
  
  healthCheck: () => 
    mlApi.get('/health').then(res => res.data)
}

// Utilidades para manejo de errores
export const handleApiError = (error) => {
  if (error.response) {
    // Error del servidor
    return {
      success: false,
      error: error.response.data.error || 'Error del servidor',
      details: error.response.data.details,
      status: error.response.status,
      domain: 'municipal.huancacode.com'
    }
  } else if (error.request) {
    // Error de red
    return {
      success: false,
      error: 'Error de conexión. Verifique su conexión a internet.',
      status: 0,
      domain: 'municipal.huancacode.com'
    }
  } else {
    // Error inesperado
    return {
      success: false,
      error: 'Error inesperado',
      details: error.message,
      domain: 'municipal.huancacode.com'
    }
  }
}

// Hook personalizado para llamadas API
export const useApi = () => {
  const makeRequest = async (apiCall, options = {}) => {
    try {
      const response = await apiCall()
      return { success: true, data: response }
    } catch (error) {
      return handleApiError(error)
    }
  }

  return { makeRequest }
}

export default api