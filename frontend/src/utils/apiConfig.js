// Configuración centralizada de APIs
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://municipal.huancacode.com/api',
  ML_BASE_URL: import.meta.env.VITE_ML_API_URL || 'https://municipal.huancacode.com/ml-api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
}

// Headers comunes
export const getAuthHeaders = () => {
  const token = localStorage.getItem('municipalidad_token')
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  }
}

// Headers para upload
export const getUploadHeaders = () => {
  const token = localStorage.getItem('municipalidad_token')
  return {
    'Authorization': token ? `Bearer ${token}` : ''
    // No Content-Type para FormData (se establece automáticamente)
  }
}
