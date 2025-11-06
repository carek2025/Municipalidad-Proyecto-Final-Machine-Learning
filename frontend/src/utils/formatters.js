import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// Formateadores de fechas
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '-'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatStr, { locale: es })
  } catch {
    return '-'
  }
}

export const formatDateTime = (date) => {
  return formatDate(date, "dd/MM/yyyy 'a las' HH:mm")
}

export const formatRelativeTime = (date) => {
  if (!date) return '-'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(dateObj, { 
      addSuffix: true, 
      locale: es 
    })
  } catch {
    return '-'
  }
}

// Formateadores de texto
export const capitalize = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const formatTipoTramite = (tipo) => {
  const tipos = {
    'LICENCIA_FUNCIONAMIENTO': 'Licencia de Funcionamiento',
    'PERMISO_CONSTRUCCION': 'Permiso de Construcción',
    'PARTIDA_NACIMIENTO': 'Partida de Nacimiento',
    'MATRIMONIO_CIVIL': 'Matrimonio Civil',
    'DEFUNCION': 'Partida de Defunción',
    'CONSTANCIA_VECINDAD': 'Constancia de Vecindad',
    'RECLAMO': 'Reclamo o Queja',
    'SOLICITUD_SERVICIO': 'Solicitud de Servicio',
    'PAGO_ARBITRIOS': 'Pago de Arbitrios',
    'AUTORIZACION_EVENTO': 'Autorización de Evento',
    'LICENCIA_CONDUCIR': 'Licencia de Conducir',
    'VERIFICACION_VEHICULAR': 'Verificación Vehicular'
  }
  return tipos[tipo] || tipo
}

export const formatEstado = (estado) => {
  const estados = {
    'PENDIENTE': 'Pendiente',
    'EN_REVISION': 'En Revisión',
    'APROBADO': 'Aprobado',
    'RECHAZADO': 'Rechazado',
    'COMPLETADO': 'Completado',
    'CANCELADO': 'Cancelado'
  }
  return estados[estado] || estado
}

export const formatPrioridad = (prioridad) => {
  const prioridades = {
    'BAJA': 'Baja',
    'MEDIA': 'Media',
    'ALTA': 'Alta',
    'URGENTE': 'Urgente'
  }
  return prioridades[prioridad] || prioridad
}

// Formateadores de números
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '-'
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number)
}

export const formatPorcentaje = (number, decimals = 1) => {
  if (number === null || number === undefined) return '-'
  return `${formatNumber(number, decimals)}%`
}

// Validadores
export const isValidDNI = (dni) => {
  return /^\d{8}$/.test(dni)
}

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const isValidPhone = (phone) => {
  return /^\d{9}$/.test(phone)
}

// Generadores
export const generateTramiteCode = (tipo, numero) => {
  const prefixMap = {
    'LICENCIA_FUNCIONAMIENTO': 'LF',
    'PERMISO_CONSTRUCCION': 'PC',
    'PARTIDA_NACIMIENTO': 'PN',
    'MATRIMONIO_CIVIL': 'MC',
    'DEFUNCION': 'DF',
    'CONSTANCIA_VECINDAD': 'CV',
    'RECLAMO': 'RC',
    'SOLICITUD_SERVICIO': 'SS',
    'PAGO_ARBITRIOS': 'PA',
    'AUTORIZACION_EVENTO': 'AE',
    'LICENCIA_CONDUCIR': 'LC',
    'VERIFICACION_VEHICULAR': 'VV'
  }
  
  const prefix = prefixMap[tipo] || 'TR'
  const fecha = new Date()
  const year = fecha.getFullYear().toString().slice(-2)
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0')
  
  return `${prefix}${year}${month}${numero.toString().padStart(4, '0')}`
}