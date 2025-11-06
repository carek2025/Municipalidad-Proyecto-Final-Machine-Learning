import React from 'react'
import { X, LayoutDashboard, FileText, AlertTriangle, BarChart3, Users, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const MobileSidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()

  if (!isOpen) return null

  const citizenMenu = [
    {
      name: 'Mi Portal',
      href: '/portal',
      icon: LayoutDashboard
    },
    {
      name: 'Mis Trámites',
      href: '/tramites',
      icon: FileText
    },
    {
      name: 'Mi Perfil',
      href: '/perfil',
      icon: Users
    }
  ]

  const staffMenu = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Gestión de Trámites',
      href: '/tramites',
      icon: FileText
    },
    {
      name: 'Alertas del Sistema',
      href: '/alertas',
      icon: AlertTriangle
    },
    {
      name: 'Reportes',
      href: '/reportes',
      icon: BarChart3
    },
    {
      name: 'Configuración',
      href: '/configuracion',
      icon: Settings
    }
  ]

  const menuItems = user?.rol === 'ciudadano' ? citizenMenu : staffMenu

  return (
    <div className="lg:hidden">
      <div className="fixed inset-0 flex z-50">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={onClose}
        />
        
        {/* Sidebar */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-municipal-dark">
          {/* Close button */}
          <div className="absolute top-0 right-0 -mr-12 pt-4">
            <button
              onClick={onClose}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center px-4 py-6 border-b border-gray-700">
            <h1 className="text-lg font-bold text-white font-title">MUNI HUÁNUCO</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-municipal-primary text-white shadow-sm'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </NavLink>
              )
            })}
          </nav>

          {/* User info */}
          <div className="px-4 py-4 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-municipal-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.nombres} {user?.apellidos}
                </p>
                <p className="text-xs text-gray-400 capitalize truncate">
                  {user?.rol === 'ciudadano' ? 'Ciudadano' : user?.cargo || user?.rol}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileSidebar