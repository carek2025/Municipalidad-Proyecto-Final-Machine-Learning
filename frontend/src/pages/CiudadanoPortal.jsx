import React from 'react'
import { useQuery } from 'react-query'
import { FileText, Plus, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { tramitesAPI, dashboardAPI } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'
import MetricCard from '../components/dashboard/MetricCard'
import { Link } from 'react-router-dom'

const CiudadanoPortal = () => {
  const { user } = useAuth()

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'dashboardCiudadano',
    dashboardAPI.getEstadisticas
  )

  const { data: tramitesRecientes, isLoading: tramitesLoading } = useQuery(
    'tramitesRecientesCiudadano',
    () => tramitesAPI.getAll({ page: 1, limit: 5 })
  )

  if (dashboardLoading || tramitesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Cargando portal..." />
      </div>
    )
  }

  const metrics = dashboardData?.metricasGenerales || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-title">
            Portal del Ciudadano
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido/a, {user?.nombres}. Gestione sus trámites municipales.
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
            className="text-sm text-municipal-primary hover:text-blue-700 font-medium"
          >
            Ver todos →
          </Link>
        </div>

        <div className="space-y-4">
          {tramitesRecientes?.tramites?.length === 0 ? (
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
            tramitesRecientes?.tramites?.map((tramite) => (
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
                      <span className={`badge ${
                        tramite.estado === 'COMPLETADO' ? 'badge-completed' :
                        tramite.estado === 'EN_REVISION' ? 'badge-in-progress' :
                        tramite.estado === 'PENDIENTE' ? 'badge-pending' : 'badge-low'
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
                  <span className={`badge ${
                    tramite.prioridad === 'URGENTE' ? 'badge-urgent' :
                    tramite.prioridad === 'ALTA' ? 'badge-high' :
                    tramite.prioridad === 'MEDIA' ? 'badge-medium' : 'badge-low'
                  }`}>
                    {tramite.prioridad}
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