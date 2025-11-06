import React, { useState } from 'react'
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import { formatTipoTramite } from '../../utils/formatters'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Botón menú móvil y título */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-municipal-primary"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-title">
              Municipalidad de Huánuco
            </h1>
            <p className="text-sm text-gray-600">
              Sistema de Gestión Documental
            </p>
          </div>
        </div>

        {/* Controles del usuario */}
        <div className="flex items-center space-x-4">
          {/* Notificaciones */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              icon={Bell}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                3
              </span>
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {/* Lista de notificaciones */}
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">
                      Nuevo trámite urgente
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Se ha registrado un trámite con prioridad alta
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Hace 5 minutos</p>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-gray-200">
                  <button className="text-sm text-municipal-primary hover:text-blue-700 font-medium">
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Menú de usuario */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-municipal-primary"
            >
              <div className="w-8 h-8 bg-municipal-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.nombres} {user?.apellidos}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {user?.rol === 'ciudadano' ? 'Ciudadano' : user?.cargo || user?.rol}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.nombres} {user?.apellidos}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {user?.dni}
                  </p>
                </div>
                
                <a
                  href="/perfil"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="h-4 w-4 mr-3" />
                  Mi Perfil
                </a>
                
                <a
                  href="/configuracion"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Configuración
                </a>
                
                <div className="border-t border-gray-200 my-1"></div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header