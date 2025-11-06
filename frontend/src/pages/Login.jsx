import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Building2, User, Lock, Eye, EyeOff, Mail, Phone, MapPin } from 'lucide-react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { HUANUCO_DISTRICTS } from '../utils/constants'
import { isValidDNI, isValidEmail, isValidPhone } from '../utils/formatters'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    dni: '',
    password: '',
    nombres: '',
    apellidos: '',
    email: '',
    celular: '',
    direccion: '',
    distrito: ''
  })

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let result

      if (isLogin) {
        // Validaciones de login
        if (!formData.dni || !formData.password) {
          setError('DNI y contraseña son requeridos')
          setLoading(false)
          return
        }

        if (!isValidDNI(formData.dni)) {
          setError('El DNI debe tener 8 dígitos')
          setLoading(false)
          return
        }

        result = await login(formData.dni, formData.password)
      } else {
        // Validaciones de registro
        const requiredFields = ['dni', 'nombres', 'apellidos', 'celular', 'direccion', 'distrito', 'password']
        const missingFields = requiredFields.filter(field => !formData[field])

        if (missingFields.length > 0) {
          setError('Todos los campos obligatorios deben ser completados')
          setLoading(false)
          return
        }

        if (!isValidDNI(formData.dni)) {
          setError('El DNI debe tener 8 dígitos')
          setLoading(false)
          return
        }

        if (formData.email && !isValidEmail(formData.email)) {
          setError('El formato del email es inválido')
          setLoading(false)
          return
        }

        if (!isValidPhone(formData.celular)) {
          setError('El celular debe tener 9 dígitos')
          setLoading(false)
          return
        }

        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          setLoading(false)
          return
        }

        result = await register(formData)
      }

      if (result.success) {
        setSuccess(isLogin ? '¡Inicio de sesión exitoso!' : '¡Registro completado exitosamente!')
        
        // Redirigir después de un breve delay
        setTimeout(() => {
          const redirectTo = result.user.rol === 'ciudadano' ? '/portal' : '/dashboard'
          navigate(redirectTo, { replace: true })
        }, 1000)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Validaciones en tiempo real
    if (name === 'dni') {
      // Solo números, máximo 8 dígitos
      const numericValue = value.replace(/\D/g, '').slice(0, 8)
      setFormData(prev => ({ ...prev, [name]: numericValue }))
    } else if (name === 'celular') {
      // Solo números, máximo 9 dígitos
      const numericValue = value.replace(/\D/g, '').slice(0, 9)
      setFormData(prev => ({ ...prev, [name]: numericValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const resetForm = () => {
    setFormData({
      dni: '',
      password: '',
      nombres: '',
      apellidos: '',
      email: '',
      celular: '',
      direccion: '',
      distrito: ''
    })
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-municipal-primary to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-municipal-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-title">
            Municipalidad de Huánuco
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Iniciar Sesión en el Sistema' : 'Registro de Ciudadano'}
          </p>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            {success}
          </Alert>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleChange}
                      required
                      className="input-primary pl-10"
                      placeholder="Ingrese sus nombres"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    required
                    className="input-primary"
                    placeholder="Ingrese sus apellidos"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-primary pl-10"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Celular *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="tel"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    required
                    className="input-primary pl-10"
                    placeholder="912345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    required
                    className="input-primary pl-10"
                    placeholder="Ingrese su dirección"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distrito *
                </label>
                <select
                  name="distrito"
                  value={formData.distrito}
                  onChange={handleChange}
                  required
                  className="input-primary"
                >
                  <option value="">Seleccionar distrito</option>
                  {HUANUCO_DISTRICTS.map(distrito => (
                    <option key={distrito} value={distrito}>
                      {distrito}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DNI *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                maxLength="8"
                className="input-primary pl-10"
                placeholder="Ingrese su DNI"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-primary pl-10 pr-10"
                placeholder="Ingrese su contraseña"
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                La contraseña debe tener al menos 6 caracteres
              </p>
            )}
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </Button>
        </form>

        {/* Cambiar entre login y registro */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              resetForm()
            }}
            className="text-municipal-primary hover:text-blue-700 font-medium"
          >
            {isLogin 
              ? '¿No tienes cuenta? Regístrate aquí' 
              : '¿Ya tienes cuenta? Inicia sesión aquí'
            }
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            <strong>Personal Municipal:</strong> Contacte al administrador para obtener sus credenciales de acceso.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login