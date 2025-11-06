import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import MetricCard from '../components/dashboard/MetricCard'
import ChartContainer from '../components/dashboard/ChartContainer'
import RecentTramites from '../components/dashboard/RecentTramites'
import UrgentAlerts from '../components/dashboard/UrgentAlerts'

const Dashboard = () => {
  const { user } = useAuth()
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Fetch datos del dashboard
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery('dashboard', dashboardAPI.getEstadisticas, {
    refetchInterval: 30000, // Actualizar cada 30 segundos
    staleTime: 10000,
  })

  // Fetch métricas en tiempo real
  const { data: realTimeData } = useQuery(
    'realTimeMetrics', 
    dashboardAPI.getMetricasTiempoReal,
    {
      refetchInterval: 10000, // Actualizar cada 10 segundos
    }
  )

  const handleRefresh = async () => {
    await refetch()
    setLastUpdated(new Date())
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Cargando dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="error" className="mb-6">
        Error cargando los datos del dashboard: {error.message}
      </Alert>
    )
  }

  const metrics = dashboardData?.metricasGenerales || {}
  const tramitesPorTipo = dashboardData?.tramitesPorTipo || []

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-title">
            Dashboard Principal
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido/a, {user?.nombres}. Resumen general del sistema.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="text-sm text-gray-500">
            Actualizado: {lastUpdated.toLocaleTimeString('es-PE')}
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            className="whitespace-nowrap"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Trámites"
          value={metrics.totalTramites}
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        
        <MetricCard
          title="Pendientes"
          value={metrics.tramitesPendientes}
          icon={Clock}
          trend={{ value: 5, isPositive: false }}
          color="yellow"
        />
        
        <MetricCard
          title="Urgentes"
          value={metrics.tramitesUrgentes}
          icon={AlertTriangle}
          trend={{ value: 8, isPositive: false }}
          color="red"
        />
        
        <MetricCard
          title="Completados"
          value={metrics.tramitesCompletados}
          icon={CheckCircle}
          trend={{ value: 15, isPositive: true }}
          color="green"
        />
      </div>

      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Tiempo Promedio"
          value={`${metrics.tiempoPromedioDias?.toFixed(1) || '0'} días`}
          icon={TrendingUp}
          description="Duración promedio de trámites"
          color="purple"
        />
        
        <MetricCard
          title="Eficiencia"
          value={`${((metrics.tramitesCompletados / metrics.totalTramites) * 100 || 0).toFixed(1)}%`}
          icon={BarChart3}
          description="Tasa de finalización"
          color="green"
        />
        
        <MetricCard
          title="Alertas Activas"
          value={dashboardData?.alertasActivas || 0}
          icon={AlertTriangle}
          description="Requieren atención"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de trámites por tipo */}
        <div className="lg:col-span-2">
          <ChartContainer
            title="Distribución de Trámites por Tipo"
            data={tramitesPorTipo}
            type="bar"
          />
        </div>

        {/* Alertas urgentes */}
        <div className="lg:col-span-1">
          <UrgentAlerts />
        </div>
      </div>

      {/* Trámites recientes */}
      <div className="grid grid-cols-1 gap-6">
        <RecentTramites />
      </div>

      {/* Métricas en tiempo real */}
      {realTimeData && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Métricas en Tiempo Real
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-municipal-primary">
                {realTimeData.tramitesHoy || 0}
              </div>
              <div className="text-sm text-gray-600">Trámites hoy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {realTimeData.completadosHoy || 0}
              </div>
              <div className="text-sm text-gray-600">Completados hoy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {realTimeData.urgentesActivos || 0}
              </div>
              <div className="text-sm text-gray-600">Urgentes activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {realTimeData.usuariosConectados || 0}
              </div>
              <div className="text-sm text-gray-600">Usuarios en línea</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard