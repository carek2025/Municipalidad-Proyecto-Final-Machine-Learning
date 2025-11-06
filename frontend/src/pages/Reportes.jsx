import React, { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { Download, Filter, BarChart3, PieChart, TrendingUp, Calendar, FileText } from 'lucide-react'
import { reportesAPI, dashboardAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Alert from '../components/ui/Alert'
import { formatDate, formatNumber } from '../utils/formatters'

const Reportes = () => {
  const { user } = useAuth()
  const [filters, setFilters] = useState({
    fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    fechaFin: new Date().toISOString().split('T')[0],
    tipoReporte: 'general'
  })

  // Obtener estadísticas para el reporte
  const { data: estadisticas, isLoading, error } = useQuery(
    ['reportes', filters],
    () => dashboardAPI.getEstadisticas(),
    {
      enabled: user?.rol !== 'ciudadano'
    }
  )

  // Mutación para generar reporte PDF
  const generarReporteMutation = useMutation(
    () => reportesAPI.generarReporteEstadistico(filters),
    {
      onSuccess: (data) => {
        // Crear blob y descargar
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_estadistico_${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    }
  )

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleGenerarReporte = () => {
    generarReporteMutation.mutate()
  }

  if (user?.rol === 'ciudadano') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">
            Los reportes y estadísticas están disponibles solo para el personal municipal.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Cargando reportes..." />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="error">
        Error cargando los reportes: {error.message}
      </Alert>
    )
  }

  const metricas = estadisticas?.metricasGenerales || {}
  const tramitesPorTipo = estadisticas?.tramitesPorTipo || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-title">Reportes y Estadísticas</h1>
          <p className="text-gray-600 mt-2">
            Análisis y reportes del sistema de gestión municipal
          </p>
        </div>
        
        <Button
          icon={Download}
          loading={generarReporteMutation.isLoading}
          onClick={handleGenerarReporte}
        >
          Exportar Reporte PDF
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros del Reporte
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
              className="input-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
              className="input-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Reporte
            </label>
            <select
              value={filters.tipoReporte}
              onChange={(e) => handleFilterChange('tipoReporte', e.target.value)}
              className="input-primary"
            >
              <option value="general">General</option>
              <option value="detallado">Detallado</option>
              <option value="tramites">Solo Trámites</option>
              <option value="eficiencia">Eficiencia</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              icon={Filter}
              onClick={() => setFilters({
                fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                fechaFin: new Date().toISOString().split('T')[0],
                tipoReporte: 'general'
              })}
              className="w-full"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Trámites</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatNumber(metricas.totalTramites)}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+12% vs periodo anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Finalización</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {metricas.totalTramites > 0 
                  ? formatNumber((metricas.tramitesCompletados / metricas.totalTramites) * 100, 1)
                  : 0
                }%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {metricas.tramitesCompletados} de {metricas.totalTramites} trámites
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatNumber(metricas.tiempoPromedioDias, 1)} días
              </p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Resolución de trámites
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trámites Urgentes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatNumber(metricas.tramitesUrgentes)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-red-600" />
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Requieren atención prioritaria
          </div>
        </div>
      </div>

      {/* Distribución por Tipo de Trámite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Distribución por Tipo de Trámite
          </h3>
          
          <div className="space-y-4">
            {tramitesPorTipo.map((item) => {
              const porcentaje = metricas.totalTramites > 0 
                ? (item.count / metricas.totalTramites) * 100 
                : 0
              
              return (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {item._id}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatNumber(porcentaje, 1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-municipal-primary h-2 rounded-full" 
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{item.count} trámites</span>
                      <span>{item.completados} completados</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Eficiencia por Área */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Eficiencia por Estado
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Completados</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">{metricas.tramitesCompletados}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${metricas.totalTramites > 0 ? (metricas.tramitesCompletados / metricas.totalTramites) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">En Revisión</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">
                  {metricas.totalTramites - metricas.tramitesCompletados - metricas.tramitesPendientes}
                </span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${metricas.totalTramites > 0 ? ((metricas.totalTramites - metricas.tramitesCompletados - metricas.tramitesPendientes) / metricas.totalTramites) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Pendientes</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">{metricas.tramitesPendientes}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ 
                      width: `${metricas.totalTramites > 0 ? (metricas.tramitesPendientes / metricas.totalTramites) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Resumen de Eficiencia</h4>
            <p className="text-sm text-blue-800">
              El sistema mantiene una tasa de finalización del{' '}
              <strong>
                {metricas.totalTramites > 0 
                  ? formatNumber((metricas.tramitesCompletados / metricas.totalTramites) * 100, 1)
                  : 0
                }%
              </strong>{' '}
              con un tiempo promedio de resolución de{' '}
              <strong>{formatNumber(metricas.tiempoPromedioDias, 1)} días</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Alertas del Sistema */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Métricas del Sistema
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {estadisticas?.alertasActivas || 0}
            </div>
            <div className="text-sm text-gray-600">Alertas Activas</div>
          </div>
          
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {Math.round(metricas.tiempoPromedioDias)}
            </div>
            <div className="text-sm text-gray-600">Días Promedio Resolución</div>
          </div>
          
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {tramitesPorTipo.length}
            </div>
            <div className="text-sm text-gray-600">Tipos de Trámite Activos</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reportes