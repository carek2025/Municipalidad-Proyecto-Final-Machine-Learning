import React from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { Eye, Clock, AlertTriangle } from 'lucide-react'
import { dashboardAPI } from '../../services/api'
import LoadingSpinner from '../ui/LoadingSpinner'
import { formatDate, formatTipoTramite, formatEstado, formatPrioridad } from '../../utils/formatters'

const RecentTramites = () => {
  const { data: tramites, isLoading, error } = useQuery(
    'recentTramites',
    () => dashboardAPI.getTramitesRecientes(10)
  )

  const getPriorityIcon = (prioridad) => {
    switch (prioridad) {
      case 'URGENTE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'ALTA':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800'
      case 'EN_REVISION':
        return 'bg-blue-100 text-blue-800'
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Trámites Recientes
        </h3>
        <LoadingSpinner text="Cargando trámites..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Trámites Recientes
        </h3>
        <div className="text-red-600">Error cargando trámites</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Trámites Recientes
        </h3>
        <Link
          to="/tramites"
          className="text-sm text-municipal-primary hover:text-blue-700 font-medium"
        >
          Ver todos →
        </Link>
      </div>

      <div className="space-y-4">
        {tramites?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay trámites recientes
          </div>
        ) : (
          tramites?.map((tramite) => (
            <div
              key={tramite._id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-4 flex-1">
                {getPriorityIcon(tramite.prioridad)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {tramite.codigo}
                    </span>
                    <span className={`badge ${getStatusColor(tramite.estado)}`}>
                      {formatEstado(tramite.estado)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {formatTipoTramite(tramite.tipo)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tramite.ciudadano?.nombres} {tramite.ciudadano?.apellidos} • {formatDate(tramite.fechaSolicitud)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`badge ${
                  tramite.prioridad === 'URGENTE' ? 'badge-urgent' :
                  tramite.prioridad === 'ALTA' ? 'badge-high' :
                  tramite.prioridad === 'MEDIA' ? 'badge-medium' : 'badge-low'
                }`}>
                  {formatPrioridad(tramite.prioridad)}
                </span>
                
                <Link
                  to={`/tramites/${tramite._id}`}
                  className="p-2 text-gray-400 hover:text-municipal-primary hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default RecentTramites