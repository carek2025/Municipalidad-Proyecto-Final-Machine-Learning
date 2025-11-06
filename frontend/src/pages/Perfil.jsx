import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from 'react-query'
import { User, Mail, Phone, MapPin, Save, Key, Eye, EyeOff, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { HUANUCO_DISTRICTS } from '../utils/constants'
import { isValidEmail, isValidPhone } from '../utils/formatters'

const Perfil = () => {
  const { user, updateProfile, changePassword } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('perfil')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: errorsProfile } } = useForm({
    defaultValues: {
      email: user?.email || '',
      celular: user?.celular || '',
      direccion: user?.direccion || '',
      distrito: user?.distrito || ''
    }
  })

  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: errorsPassword }, reset: resetPassword } = useForm()

  const updateProfileMutation = useMutation(updateProfile, {
    onSuccess: (result) => {
      if (result.success) {
        setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' })
        queryClient.invalidateQueries(['user'])
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    },
    onError: (error) => {
      setMessage({ type: 'error', text: 'Error actualizando el perfil' })
    }
  })

  const changePasswordMutation = useMutation(changePassword, {
    onSuccess: (result) => {
      if (result.success) {
        setMessage({ type: 'success', text: 'Contraseña cambiada exitosamente' })
        resetPassword()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    },
    onError: (error) => {
      setMessage({ type: 'error', text: 'Error cambiando la contraseña' })
    }
  })

  const onUpdateProfile = (data) => {
    updateProfileMutation.mutate(data)
  }

  const onChangePassword = (data) => {
    changePasswordMutation.mutate(data)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-title">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Gestiona tu información personal y configuración</p>
        </div>
      </div>

      {/* Mensajes */}
      {message.text && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </Alert>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('perfil')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'perfil'
                  ? 'border-municipal-primary text-municipal-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Información Personal
            </button>
            <button
              onClick={() => setActiveTab('seguridad')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'seguridad'
                  ? 'border-municipal-primary text-municipal-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Seguridad
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Información Personal */}
          {activeTab === 'perfil' && (
            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Básica */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DNI
                      </label>
                      <input
                        type="text"
                        value={user?.dni}
                        disabled
                        className="input-primary bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombres Completos
                      </label>
                      <input
                        type="text"
                        value={`${user?.nombres} ${user?.apellidos}`}
                        disabled
                        className="input-primary bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="email"
                          {...registerProfile('email', {
                            validate: value => !value || isValidEmail(value) || 'Email inválido'
                          })}
                          className="input-primary pl-10"
                          placeholder="ejemplo@correo.com"
                        />
                      </div>
                      {errorsProfile.email && (
                        <p className="text-red-600 text-sm mt-1">{errorsProfile.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Celular
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="tel"
                          {...registerProfile('celular', {
                            required: 'Celular es requerido',
                            validate: value => isValidPhone(value) || 'Celular debe tener 9 dígitos'
                          })}
                          className="input-primary pl-10"
                          placeholder="912345678"
                        />
                      </div>
                      {errorsProfile.celular && (
                        <p className="text-red-600 text-sm mt-1">{errorsProfile.celular.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          {...registerProfile('direccion', {
                            required: 'Dirección es requerida',
                            minLength: { value: 5, message: 'La dirección debe tener al menos 5 caracteres' }
                          })}
                          className="input-primary pl-10"
                          placeholder="Ingrese su dirección completa"
                        />
                      </div>
                      {errorsProfile.direccion && (
                        <p className="text-red-600 text-sm mt-1">{errorsProfile.direccion.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Distrito
                      </label>
                      <select
                        {...registerProfile('distrito', { required: 'Distrito es requerido' })}
                        className="input-primary"
                      >
                        <option value="">Seleccionar distrito</option>
                        {HUANUCO_DISTRICTS.map(distrito => (
                          <option key={distrito} value={distrito}>
                            {distrito}
                          </option>
                        ))}
                      </select>
                      {errorsProfile.distrito && (
                        <p className="text-red-600 text-sm mt-1">{errorsProfile.distrito.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  loading={updateProfileMutation.isLoading}
                  icon={Save}
                >
                  Guardar Cambios
                </Button>
              </div>
            </form>
          )}

          {/* Tab: Seguridad */}
          {activeTab === 'seguridad' && (
            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-6">
              <div className="max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Contraseña</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        {...registerPassword('currentPassword', {
                          required: 'La contraseña actual es requerida'
                        })}
                        className="input-primary pl-10 pr-10"
                        placeholder="Ingrese su contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errorsPassword.currentPassword && (
                      <p className="text-red-600 text-sm mt-1">{errorsPassword.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        {...registerPassword('newPassword', {
                          required: 'La nueva contraseña es requerida',
                          minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message: 'Debe incluir mayúscula, minúscula y número'
                          }
                        })}
                        className="input-primary pl-10 pr-10"
                        placeholder="Ingrese nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errorsPassword.newPassword && (
                      <p className="text-red-600 text-sm mt-1">{errorsPassword.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      {...registerPassword('confirmPassword', {
                        required: 'Confirme la nueva contraseña',
                        validate: value => value === document.getElementById('newPassword')?.value || 'Las contraseñas no coinciden'
                      })}
                      className="input-primary"
                      placeholder="Confirme nueva contraseña"
                    />
                    {errorsPassword.confirmPassword && (
                      <p className="text-red-600 text-sm mt-1">{errorsPassword.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Requisitos de contraseña segura:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Mínimo 6 caracteres</li>
                    <li>• Al menos una letra mayúscula</li>
                    <li>• Al menos una letra minúscula</li>
                    <li>• Al menos un número</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    loading={changePasswordMutation.isLoading}
                    icon={Key}
                  >
                    Cambiar Contraseña
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Información de la Cuenta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Cuenta</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Datos de Registro</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Fecha de Registro:</dt>
                <dd className="text-gray-900">{new Date(user?.fechaRegistro).toLocaleDateString('es-PE')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Último Acceso:</dt>
                <dd className="text-gray-900">
                  {user?.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleString('es-PE') : 'Nunca'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Rol:</dt>
                <dd className="text-gray-900 capitalize">{user?.rol}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Preferencias</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Notificaciones Email:</dt>
                <dd className="text-gray-900">{user?.configuracion?.notificacionesEmail ? 'Activadas' : 'Desactivadas'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Notificaciones SMS:</dt>
                <dd className="text-gray-900">{user?.configuracion?.notificacionesSMS ? 'Activadas' : 'Desactivadas'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Tema Oscuro:</dt>
                <dd className="text-gray-900">{user?.configuracion?.temaOscuro ? 'Activado' : 'Desactivado'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Perfil