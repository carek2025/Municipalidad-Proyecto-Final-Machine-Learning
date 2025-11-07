import axios from 'axios';

// Configuración de URLs según el entorno
const isDevelopment = import.meta.env.MODE === 'development';

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://municipal.huancacode.com/api',
  ML_BASE_URL: import.meta.env.VITE_ML_API_URL || 'https://municipal.huancacode.com/ml-api',
  TIMEOUT: 30000,
};

console.log('🔧 API Configuration:', {
  baseURL: API_CONFIG.BASE_URL,
  mlURL: API_CONFIG.ML_BASE_URL,
  mode: import.meta.env.MODE
});

// Crear instancia de axios para API principal
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Crear instancia para ML API
const mlApi = axios.create({
  baseURL: API_CONFIG.ML_BASE_URL,
  timeout: 15000,
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('municipalidad_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo de respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('municipalidad_token');
      window.location.href = '/login';
    }
    
    if (!error.response) {
      console.error('🔴 Error de red:', error.message);
    }
    
    return Promise.reject(error);
  }
);

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
    api.put('/auth/change-password', passwordData).then(res => res.data),
};

// Servicios de Trámites
export const tramitesAPI = {
  create: (tramiteData) => 
    api.post('/tramites', tramiteData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
  
  getAll: (params = {}) => 
    api.get('/tramites', { params }).then(res => res.data),
  
  getById: (id) => 
    api.get(`/tramites/${id}`).then(res => res.data),
  
  updateEstado: (id, estadoData) => 
    api.put(`/tramites/${id}/estado`, estadoData).then(res => res.data),
  
  asignarFuncionario: (id, funcionarioId) => 
    api.put(`/tramites/${id}/asignar`, { funcionarioId }).then(res => res.data),
};

// Servicios de Alertas
export const alertasAPI = {
  getAll: (params = {}) => 
    api.get('/alertas', { params }).then(res => res.data),
  
  getById: (id) => 
    api.get(`/alertas/${id}`).then(res => res.data),
  
  marcarLeida: (id) => 
    api.put(`/alertas/${id}/leida`).then(res => res.data),
  
  resolverAlerta: ({ alertaId, observaciones }) => 
    api.put(`/alertas/${alertaId}/resolver`, { observaciones }).then(res => res.data),
  
  getEstadisticas: () => 
    api.get('/alertas/estadisticas/estadisticas').then(res => res.data),
};

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
    api.get('/dashboard/distribucion-areas').then(res => res.data),
};

// Servicios de PDF
export const reportesAPI = {
  generarPDF: (tramiteId, options = {}) => 
    api.post('/pdf/generar', { tramiteId, ...options }).then(res => res.data),
  
  descargarPDF: (tramiteId) => 
    api.get(`/pdf/descargar/${tramiteId}`, { responseType: 'blob' }).then(res => res.data),
  
  generarReporteEstadistico: (params = {}) => 
    api.post('/pdf/reporte-estadistico', params, { responseType: 'blob' }).then(res => res.data),
};

// Servicios de Machine Learning
export const mlService = {
  predecirUrgencia: async (texto) => {
    try {
      console.log('🔍 Enviando texto para análisis ML:', texto.substring(0, 100) + '...');
      
      const response = await mlApi.post('/predict/urgency', { text: texto },{
        timeout: 10000 // 10 segundos timeout
      });

      console.log('✅ Respuesta ML recibida:', response.data);

      return {
        success: true,
        prediction: response.data
      };
    } catch (error) {
      console.warn('⚠️ ML Service no disponible, usando análisis básico');
      return {
        success: true,
        prediction: {
          priority: 'MEDIA',
          urgency_score: 50,
          found_keywords: [],
          confidence: 0.7,
          fallback: true
        }
      };
    }
  },
  
  healthCheck: () => 
    mlApi.get('/health').then(res => res.data).catch(() => ({ healthy: false })),
};

// Manejo de errores
export const handleApiError = (error) => {
  if (error.response) {
    return {
      success: false,
      error: error.response.data.error || 'Error del servidor',
      details: error.response.data.details,
      status: error.response.status,
    };
  } else if (error.request) {
    return {
      success: false,
      error: 'Error de conexión. Verifique su conexión a internet.',
      status: 0,
    };
  } else {
    return {
      success: false,
      error: 'Error inesperado',
      details: error.message,
    };
  }
};

export default api;
