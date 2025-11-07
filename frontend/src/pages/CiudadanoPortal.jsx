import React from 'react'
import { useQuery } from 'react-query'
import { FileText, Plus, Clock, CheckCircle, AlertTriangle, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { tramitesAPI, dashboardAPI } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'
import { Link } from 'react-router-dom'

// Componente MetricCard local (temporal)
const MetricCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600', 
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value || 0}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

const CiudadanoPortal = () => {
  const { user } = useAuth()

  // Fetch datos con manejo robusto de errores
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError 
  } = useQuery(
    'dashboardCiudadano',
    () => dashboardAPI.getEstadisticas(),
    {
      retry: 1,
      onError: (error) => {
        console.error('Error loading dashboard:', error)
      }
    }
  )

  const { 
    data: tramitesData, 
    isLoading: tramitesLoading, 
    error: tramitesError 
  } = useQuery(
    'tramitesRecientesCiudadano',
    () => tramitesAPI.getAll({ page: 1, limit: 5 }),
    {
      retry: 1,
      onError: (error) => {
        console.error('Error loading tramites:', error)
      }
    }
  )

  // Estados de carga y error
  const isLoading = dashboardLoading || tramitesLoading
  const hasError = dashboardError || tramitesError

  // Datos seguros con valores por defecto
  const metrics = dashboardData?.metricasGenerales || {
    totalTramites: 0,
    tramitesPendientes: 0,
    tramitesUrgentes: 0,
    tramitesCompletados: 0
  }

  const tramites = tramitesData?.tramites || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Cargando portal..." />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error de conexión</h2>
        <p className="text-gray-600 mb-6">
          No se pudieron cargar los datos. Por favor, intente nuevamente.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-title">
            Portal del Ciudadano
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido/a, {user?.nombres || 'Usuario'}. Gestione sus trámites municipales.
          </p>
        </div>
        
        <Link to="/tramites?modal=new">
          <Button icon={Plus} className="whitespace-nowrap">
            Nuevo Trámite
          </Button>
        </Link>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Trámites"
          value={metrics.totalTramites}
          icon={FileText}
          color="blue"
        />
        
        <MetricCard
          title="Pendientes"
          value={metrics.tramitesPendientes}
          icon={Clock}
          color="yellow"
        />
        
        <MetricCard
          title="Urgentes"
          value={metrics.tramitesUrgentes}
          icon={AlertTriangle}
          color="red"
        />
        
        <MetricCard
          title="Completados"
          value={metrics.tramitesCompletados}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Trámites Recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Trámites Recientes
          </h3>
          <Link
            to="/tramites"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todos →
          </Link>
        </div>

        <div className="space-y-4">
          {tramites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No tiene trámites registrados
              </p>
              <p className="text-gray-600 mb-4">
                Comience por crear su primer trámite municipal
              </p>
              <Link to="/tramites?modal=new">
                <Button icon={Plus}>
                  Crear Primer Trámite
                </Button>
              </Link>
            </div>
          ) : (
            tramites.map((tramite) => (
              <div
                key={tramite._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`p-2 rounded-lg ${
                    tramite.prioridad === 'URGENTE' ? 'bg-red-100 text-red-600' :
                    tramite.prioridad === 'ALTA' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {tramite.codigo}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tramite.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                        tramite.estado === 'EN_REVISION' ? 'bg-blue-100 text-blue-800' :
                        tramite.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tramite.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {tramite.descripcion}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tramite.fechaSolicitud).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    tramite.prioridad === 'URGENTE' ? 'bg-red-100 text-red-800' :
                    tramite.prioridad === 'ALTA' ? 'bg-orange-100 text-orange-800' :
                    tramite.prioridad === 'MEDIA' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {tramite.prioridad}
                  </span>
                  
                  <Link
                    to={`/tramites/${tramite._id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Información Útil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">
            📞 Contacto y Ayuda
          </h4>
          <ul className="space-y-2 text-blue-800">
            <li>• Teléfono: (062) 512255</li>
            <li>• Email: info@munihuanuco.gob.pe</li>
            <li>• Horario: Lunes a Viernes 8:00 AM - 5:00 PM</li>
            <li>• Dirección: Av. Universitaria S/N, Huánuco</li>
          </ul>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h4 className="text-lg font-semibold text-green-900 mb-3">
            💡 Tips Rápidos
          </h4>
          <ul className="space-y-2 text-green-800">
            <li>• Revise los requisitos antes de crear un trámite</li>
            <li>• Describa claramente su solicitud</li>
            <li>• Adjunte todos los documentos requeridos</li>
            <li>• Revise regularmente el estado de sus trámites</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CiudadanoPortal
