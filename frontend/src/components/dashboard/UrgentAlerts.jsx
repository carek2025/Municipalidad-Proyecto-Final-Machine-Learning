import React from 'react'
import { useQuery } from 'react-query'
import { AlertTriangle, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { alertasAPI } from '../../services/api'
import LoadingSpinner from '../ui/LoadingSpinner'
import { formatRelativeTime } from '../../utils/formatters'

const UrgentAlerts = () => {
  const { 
    data: alertasData, 
    isLoading, 
    error,
    isError 
  } = useQuery(
    ['alertas', 'urgentes'],
    () => alertasAPI.getAll({ 
      nivel: 'CRITICO', 
      leida: 'false',
      page: 1,
      limit: 5
    }),
    {
      retry: 2,
      retryDelay: 1000,
      staleTime: 30000,
      // Si la API falla, no romper el componente
      onError: (error) => {
        console.warn('Error cargando alertas urgentes:', error.message)
      }
    }
  )

  // Datos seguros - prevenir undefined
  const alertas = alertasData?.alertas || []
  const hasAlerts = alertas && alertas.length > 0

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Alertas Urgentes
          </h3>
          <div className="w-6 h-6">
            <LoadingSpinner size="sm" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-3">
                <div className="w-5 h-5 bg-gray-200 rounded-full mt-0.5"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Alertas Urgentes
          </h3>
          <AlertCircle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="text-center py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm">
              Información de alertas temporalmente no disponible
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Alertas Urgentes
        </h3>
        {hasAlerts && (
          <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-medium border border-rose-200">
            {alertas.length}
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        {!hasAlerts ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Sin alertas urgentes</p>
            <p className="text-sm text-gray-500 mt-1">Todo está bajo control</p>
          </div>
        ) : (
          alertas.slice(0, 3).map((alerta) => (
            <div
              key={alerta._id}
              className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors group"
            >
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-semibold text-rose-800 truncate">
                    {alerta.titulo || 'Alerta del sistema'}
                  </p>
                  {alerta.nivel && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      alerta.nivel === 'CRITICO' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                      alerta.nivel === 'ALTO' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {alerta.nivel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-rose-600 line-clamp-2">
                  {alerta.mensaje || 'Sin descripción disponible'}
                </p>
                {alerta.fechaGeneracion && (
                  <div className="flex items-center mt-2 text-xs text-rose-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatRelativeTime(alerta.fechaGeneracion)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {hasAlerts && alertas.length > 3 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Ver todas las alertas ({alertas.length})
          </button>
        </div>
      )}
    </div>
  )
}

export default UrgentAlerts
