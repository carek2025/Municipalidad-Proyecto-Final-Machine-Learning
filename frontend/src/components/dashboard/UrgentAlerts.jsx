import React from 'react'
import { useQuery } from 'react-query'
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { alertasAPI } from '../../services/api'
import LoadingSpinner from '../ui/LoadingSpinner'
import { formatRelativeTime } from '../../utils/formatters'

const UrgentAlerts = () => {
  const { data: alertas, isLoading, error } = useQuery(
    'alertasUrgentes',
    () => alertasAPI.getAll({ nivel: 'CRITICO', leida: false })
  )

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <LoadingSpinner size="sm" text="Cargando alertas..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-red-600">Error cargando alertas</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Alertas Urgentes
      </h3>
      
      <div className="space-y-3">
        {alertas?.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            No hay alertas urgentes
          </div>
        ) : (
          alertas?.slice(0, 5).map((alerta) => (
            <div
              key={alerta._id}
              className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 truncate">
                  {alerta.titulo}
                </p>
                <p className="text-sm text-red-600 mt-1 line-clamp-2">
                  {alerta.mensaje}
                </p>
                <div className="flex items-center mt-1 text-xs text-red-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatRelativeTime(alerta.fechaGeneracion)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {alertas && alertas.length > 5 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button className="text-sm text-municipal-primary hover:text-blue-700 font-medium w-full text-center">
            Ver todas las alertas ({alertas.length})
          </button>
        </div>
      )}
    </div>
  )
}

export default UrgentAlerts