import { body, validationResult } from 'express-validator'

// Validaciones para registro de usuario
export const validateUserRegistration = [
  body('dni')
    .isLength({ min: 8, max: 8 })
    .withMessage('El DNI debe tener 8 dígitos')
    .isNumeric()
    .withMessage('El DNI debe contener solo números'),
  
  body('nombres')
    .isLength({ min: 2, max: 100 })
    .withMessage('Los nombres deben tener entre 2 y 100 caracteres')
    .trim()
    .escape(),
  
  body('apellidos')
    .isLength({ min: 2, max: 100 })
    .withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
    .trim()
    .escape(),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('celular')
    .isLength({ min: 9, max: 9 })
    .withMessage('El celular debe tener 9 dígitos')
    .isNumeric()
    .withMessage('El celular debe contener solo números'),
  
  body('direccion')
    .isLength({ min: 5, max: 200 })
    .withMessage('La dirección debe tener entre 5 y 200 caracteres')
    .trim()
    .escape(),
  
  body('distrito')
    .isIn([
      'Huanuco', 'Amarilis', 'Pillco Marca', 'Yacus', 'Chinchao',
      'Churubamba', 'Santa María del Valle', 'San Francisco de Cayrán', 'San Pedro de Chaulan'
    ])
    .withMessage('Distrito no válido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
]

// Validaciones para creación de trámites
export const validateTramiteCreation = [
  body('tipo')
    .isIn([
      'LICENCIA_FUNCIONAMIENTO',
      'PERMISO_CONSTRUCCION', 
      'PARTIDA_NACIMIENTO',
      'MATRIMONIO_CIVIL',
      'DEFUNCION',
      'CONSTANCIA_VECINDAD',
      'RECLAMO',
      'SOLICITUD_SERVICIO',
      'PAGO_ARBITRIOS',
      'AUTORIZACION_EVENTO',
      'LICENCIA_CONDUCIR',
      'VERIFICACION_VEHICULAR'
    ])
    .withMessage('Tipo de trámite no válido'),
  
  body('descripcion')
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres')
    .trim()
    .escape()
]

// Validaciones para cambio de estado de trámite
export const validateTramiteStatus = [
  body('estado')
    .isIn(['PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO', 'COMPLETADO', 'CANCELADO'])
    .withMessage('Estado no válido'),
  
  body('observaciones')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las observaciones no pueden exceder 500 caracteres')
    .trim()
    .escape()
]

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Error de validación',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    })
  }
  next()
}

// Validaciones para actualización de perfil
export const validateProfileUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('celular')
    .optional()
    .isLength({ min: 9, max: 9 })
    .withMessage('El celular debe tener 9 dígitos')
    .isNumeric()
    .withMessage('El celular debe contener solo números'),
  
  body('direccion')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('La dirección debe tener entre 5 y 200 caracteres')
    .trim()
    .escape(),
  
  body('distrito')
    .optional()
    .isIn([
      'Huanuco', 'Amarilis', 'Pillco Marca', 'Yacus', 'Chinchao',
      'Churubamba', 'Santa María del Valle', 'San Francisco de Cayrán', 'San Pedro de Chaulan'
    ])
    .withMessage('Distrito no válido')
]

// Validaciones para cambio de contraseña
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
]