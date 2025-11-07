import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  RefreshCw,
  Eye,
  Users
} from 'lucide-react'
import { dashboardAPI, tramitesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { Link } from 'react-router-dom'
import { formatDate, formatTipoTramite, formatEstado, formatPrioridad } from '../utils/formatters'
import UrgentAlerts from '../components/dashboard/UrgentAlerts'

const Dashboard = () => {
  const { user } = useAuth()
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Fetch datos del dashboard con manejo robusto
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError, 
    refetch: refetchDashboard 
  } = useQuery(
    'dashboard',
    dashboardAPI.getEstadisticas,
    {
      refetchInterval: 30000,
      staleTime: 10000,
      retry: 2,
      onError: (error) => {
        console.error('Error loading dashboard:', error)
      }
    }
  )

  // Fetch trámites recientes
  const { 
    data: tramitesData, 
    isLoading: tramitesLoading, 
    error: tramitesError 
  } = useQuery(
    'tramites-recientes',
    () => tramitesAPI.getAll({ page: 1, limit: 5 }),
    {
      staleTime: 30000,
      retry: 2
    }
  )

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchDashboard()])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error refreshing:', error)
    }
  }

  // Datos seguros con valores por defecto
  const metrics = dashboardData?.metricasGenerales || {
    totalTramites: 0,
    tramitesPendientes: 0,
    tramitesUrgentes: 0,
    tramitesCompletados: 0,
    tiempoPromedioDias: 0
  }

  const tramites = tramitesData?.tramites || []
  const isLoading = dashboardLoading || tramitesLoading
  const hasError = dashboardError || tramitesError

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Cargando dashboard..." />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 font-title">
            Dashboard Principal
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido/a, <span className="font-semibold text-gray-800">{user?.nombres}</span>. Resumen general del sistema.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border">
            Actualizado: {lastUpdated.toLocaleTimeString('es-PE')}
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            className="border-gray-300 hover:border-gray-400"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alertas de error */}
      {hasError && (
        <Alert variant="warning" className="animate-slide-down">
          <div className="flex items-center justify-between">
            <span>Puede haber datos incompletos debido a errores de conexión</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Trámites */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total de Trámites</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalTramites}</p>
              <div className="flex items-center mt-2 text-sm text-emerald-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+12% este mes</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Pendientes</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.tramitesPendientes}</p>
              <div className="flex items-center mt-2 text-sm text-amber-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Requieren atención</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Urgentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Urgentes</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.tramitesUrgentes}</p>
              <div className="flex items-center mt-2 text-sm text-rose-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>Prioridad alta</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Completados */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Completados</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.tramitesCompletados}</p>
              <div className="flex items-center mt-2 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>+8% eficiencia</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Métricas y Trámites */}
        <div className="lg:col-span-2 space-y-6">
          {/* Métricas secundarias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Tiempo Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.tiempoPromedioDias?.toFixed(1) || '0'} días
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Resolución de trámites</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Eficiencia</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((metrics.tramitesCompletados / Math.max(metrics.totalTramites, 1)) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Tasa de finalización</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Trámites Recientes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Trámites Recientes</h3>
              <Link
                to="/tramites"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Ver todos <Eye className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {tramites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No hay trámites recientes</p>
                </div>
              ) : (
                tramites.slice(0, 4).map((tramite) => (
                  <div
                    key={tramite._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${
                        tramite.prioridad === 'URGENTE' ? 'bg-rose-100 text-rose-600' :
                        tramite.prioridad === 'ALTA' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {tramite.codigo}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            tramite.estado === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            tramite.estado === 'EN_REVISION' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            tramite.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {formatEstado(tramite.estado)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {formatTipoTramite(tramite.tipo)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(tramite.fechaSolicitud)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        tramite.prioridad === 'URGENTE' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        tramite.prioridad === 'ALTA' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        tramite.prioridad === 'MEDIA' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {formatPrioridad(tramite.prioridad)}
                      </span>
                      
                      <Link
                        to={`/tramites/${tramite._id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha - Alertas */}
        <div className="space-y-6">
          <UrgentAlerts />
          
          {/* Estadísticas Rápidas */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Estadísticas Rápidas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Tasa de éxito</span>
                <span className="font-semibold">
                  {((metrics.tramitesCompletados / Math.max(metrics.totalTramites, 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Tiempo promedio</span>
                <span className="font-semibold">{metrics.tiempoPromedioDias?.toFixed(1) || '0'} días</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Eficiencia</span>
                <span className="font-semibold text-emerald-300">Alta</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
