// Constantes del sistema
export const SYSTEM_CONSTANTS = {
  APP_NAME: 'Sistema de Gestión Municipal',
  MUNICIPALITY_NAME: 'Municipalidad Provincial de Huánuco',
  VERSION: '2.0.0',
  SUPPORT_EMAIL: 'soporte@munihuanuco.gob.pe',
  SUPPORT_PHONE: '(062) 512255'
}

// Roles de usuario
export const USER_ROLES = {
  CIUDADANO: 'ciudadano',
  ADMINISTRATIVO: 'administrativo',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin'
}

// Áreas municipales
export const MUNICIPAL_AREAS = {
  LICENCIAS: 'licencias',
  CONSTRUCCION: 'construccion',
  REGISTRO_CIVIL: 'registrocivil',
  TRIBUTARIA: 'tributaria',
  SERVICIOS: 'servicios',
  ADMIN: 'admin'
}

// Tipos de trámites
export const TRAMITE_TYPES = {
  LICENCIA_FUNCIONAMIENTO: 'LICENCIA_FUNCIONAMIENTO',
  PERMISO_CONSTRUCCION: 'PERMISO_CONSTRUCCION',
  PARTIDA_NACIMIENTO: 'PARTIDA_NACIMIENTO',
  MATRIMONIO_CIVIL: 'MATRIMONIO_CIVIL',
  DEFUNCION: 'DEFUNCION',
  CONSTANCIA_VECINDAD: 'CONSTANCIA_VECINDAD',
  RECLAMO: 'RECLAMO',
  SOLICITUD_SERVICIO: 'SOLICITUD_SERVICIO',
  PAGO_ARBITRIOS: 'PAGO_ARBITRIOS',
  AUTORIZACION_EVENTO: 'AUTORIZACION_EVENTO',
  LICENCIA_CONDUCIR: 'LICENCIA_CONDUCIR',
  VERIFICACION_VEHICULAR: 'VERIFICACION_VEHICULAR'
}

// Estados de trámites
export const TRAMITE_STATUS = {
  PENDIENTE: 'PENDIENTE',
  EN_REVISION: 'EN_REVISION',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO',
  COMPLETADO: 'COMPLETADO',
  CANCELADO: 'CANCELADO'
}

// Niveles de prioridad
export const PRIORITY_LEVELS = {
  BAJA: 'BAJA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
  URGENTE: 'URGENTE'
}

// Colores para estados y prioridades
export const STATUS_COLORS = {
  PENDIENTE: 'yellow',
  EN_REVISION: 'blue',
  APROBADO: 'green',
  RECHAZADO: 'red',
  COMPLETADO: 'purple',
  CANCELADO: 'gray'
}

export const PRIORITY_COLORS = {
  BAJA: 'green',
  MEDIA: 'blue',
  ALTA: 'orange',
  URGENTE: 'red'
}

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [5, 10, 25, 50],
  MAX_PAGE_SIZE: 100
}

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  POSITION: 'top-right',
  AUTO_CLOSE: 5000,
  HIDE_PROGRESS_BAR: false,
  CLOSE_ON_CLICK: true,
  PAUSE_ON_HOVER: true,
  DRAGGABLE: true
}

// Distritos de Huánuco
export const HUANUCO_DISTRICTS = [
  'Huanuco',
  'Amarilis',
  'Pillco Marca',
  'Yacus',
  'Chinchao',
  'Churubamba',
  'Santa María del Valle',
  'San Francisco de Cayrán',
  'San Pedro de Chaulan'
]