import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  AlertTriangle, 
  BarChart3, 
  Users,
  Building2,
  Settings
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()

  const isActiveLink = (path) => {
    return location.pathname === path
  }

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
    <div className="flex flex-col flex-1 bg-municipal-dark text-white">
      {/* Logo */}
      <div className="flex items-center justify-center px-6 py-4 border-b border-gray-700">
        <Building2 className="h-8 w-8 text-white mr-3" />
        <div>
          <h1 className="text-lg font-bold font-title">MUNI HUÁNUCO</h1>
          <p className="text-xs text-gray-300">Sistema de Gestión</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = isActiveLink(item.href)
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-municipal-primary text-white shadow-sm'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      {/* Información del usuario */}
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
  )
}

export default Sidebar