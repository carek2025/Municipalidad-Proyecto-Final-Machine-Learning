import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { AlertTriangle, Eye, EyeOff, CheckCircle, Filter, Search, Clock } from 'lucide-react'
import { alertasAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Alert from '../components/ui/Alert'
import Modal from '../components/ui/Modal'
import { formatDate, formatRelativeTime } from '../utils/formatters'

const Alertas = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    leida: '',
    nivel: '',
    tipo: '',
    search: ''
  })
  const [selectedAlerta, setSelectedAlerta] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Obtener alertas con filtros
  const {
    data: alertasData,
    isLoading,
    error
  } = useQuery(['alertas', filters], () => alertasAPI.getAll(filters))

  // Mutación para marcar alerta como leída
  const marcarLeidaMutation = useMutation(alertasAPI.marcarLeida, {
    onSuccess: () => {
      queryClient.invalidateQueries(['alertas'])
    }
  })

  // Mutación para resolver alerta
  const resolverAlertaMutation = useMutation(alertasAPI.resolverAlerta, {
    onSuccess: () => {
      queryClient.invalidateQueries(['alertas'])
      setShowModal(false)
    }
  })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleMarcarLeida = (alertaId) => {
    marcarLeidaMutation.mutate(alertaId)
  }

  const handleResolverAlerta = (alertaId, observaciones) => {
    resolverAlertaMutation.mutate({ alertaId, observaciones })
  }

  const handleVerDetalles = (alerta) => {
    setSelectedAlerta(alerta)
    setShowModal(true)
    
    // Marcar como leída al ver detalles
    if (!alerta.leida) {
      handleMarcarLeida(alerta._id)
    }
  }

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'CRITICO':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'ALTO':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'BAJO':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'URGENCIA_ML':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'VENCIMIENTO':
        return <Clock className="h-5 w-5 text-orange-500" />
      case 'DOCUMENTACION_INCOMPLETA':
        return <EyeOff className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-blue-500" />
    }
  }

  const alertas = alertasData?.alertas || []

  if (user?.rol === 'ciudadano') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">
            El sistema de alertas está disponible solo para el personal municipal.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-title">Sistema de Alertas</h1>
          <p className="text-gray-600 mt-2">
            Gestión y monitoreo de alertas del sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            {alertasData?.pagination?.total || 0} alertas encontradas
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Búsqueda */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar alertas..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input-primary pl-10"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.leida || ''}
              onChange={(e) => handleFilterChange('leida', e.target.value)}
              className="input-primary min-w-[150px]"
            >
              <option value="">Todas</option>
              <option value="false">No leídas</option>
              <option value="true">Leídas</option>
            </select>

            <select
              value={filters.nivel || ''}
              onChange={(e) => handleFilterChange('nivel', e.target.value)}
              className="input-primary min-w-[150px]"
            >
              <option value="">Todos los niveles</option>
              <option value="CRITICO">Crítico</option>
              <option value="ALTO">Alto</option>
              <option value="MEDIO">Medio</option>
              <option value="BAJO">Bajo</option>
            </select>

            <select
              value={filters.tipo || ''}
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
              className="input-primary min-w-[180px]"
            >
              <option value="">Todos los tipos</option>
              <option value="URGENCIA_ML">Urgencia ML</option>
              <option value="VENCIMIENTO">Vencimiento</option>
              <option value="DOCUMENTACION_INCOMPLETA">Documentación</option>
              <option value="REVISION_PENDIENTE">Revisión</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estado de carga y errores */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner size="lg" text="Cargando alertas..." />
        </div>
      )}

      {error && (
        <Alert variant="error">
          Error cargando las alertas: {error.message}
        </Alert>
      )}

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {alertas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay alertas
            </h3>
            <p className="text-gray-600">
              No se encontraron alertas que coincidan con los filtros seleccionados.
            </p>
          </div>
        ) : (
          alertas.map((alerta) => (
            <div
              key={alerta._id}
              className={`bg-white rounded-xl shadow-sm border-2 ${
                alerta.leidaGlobal 
                  ? 'border-gray-200 bg-gray-50' 
                  : getNivelColor(alerta.nivel)
              } p-6 transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Icono */}
                  <div className={`p-3 rounded-lg ${
                    alerta.leidaGlobal ? 'bg-gray-200' : getNivelColor(alerta.nivel).split(' ')[0]
                  }`}>
                    {getTipoIcon(alerta.tipo)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className={`text-lg font-semibold ${
                        alerta.leidaGlobal ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {alerta.titulo}
                      </h3>
                      <span className={`badge ${getNivelColor(alerta.nivel)}`}>
                        {alerta.nivel}
                      </span>
                      {alerta.leidaGlobal && (
                        <span className="badge bg-gray-100 text-gray-800">
                          Resuelta
                        </span>
                      )}
                    </div>

                    <p className={`mb-3 ${
                      alerta.leidaGlobal ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {alerta.mensaje}
                    </p>

                    {/* Metadatos */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatRelativeTime(alerta.fechaGeneracion)}
                      </div>
                      
                      {alerta.tramite && (
                        <div>
                          <strong>Trámite:</strong> {alerta.tramite.codigo}
                        </div>
                      )}
                      
                      <div>
                        <strong>Tipo:</strong> {alerta.tipo.replace(/_/g, ' ')}
                      </div>

                      {alerta.datosAdicionales && (
                        <div>
                          <strong>Palabras clave:</strong>{' '}
                          {alerta.datosAdicionales.palabrasClave?.join(', ') || 'N/A'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2 ml-4">
                  {!alerta.leidaGlobal && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleMarcarLeida(alerta._id)}
                      loading={marcarLeidaMutation.isLoading && marcarLeidaMutation.variables === alerta._id}
                    >
                      Marcar leída
                    </Button>
                  )}
                  
                  <Button
                    variant={alerta.leidaGlobal ? "outline" : "primary"}
                    size="sm"
                    icon={AlertTriangle}
                    onClick={() => handleVerDetalles(alerta)}
                  >
                    Ver detalles
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalles de Alerta */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Detalles de la Alerta"
        size="lg"
      >
        {selectedAlerta && (
          <div className="space-y-6">
            {/* Información General */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Alerta
                </label>
                <p className="text-gray-900">{selectedAlerta.codigo}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel
                </label>
                <span className={`badge ${getNivelColor(selectedAlerta.nivel)}`}>
                  {selectedAlerta.nivel}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <p className="text-gray-900">{selectedAlerta.tipo.replace(/_/g, ' ')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Generación
                </label>
                <p className="text-gray-900">{formatDate(selectedAlerta.fechaGeneracion)}</p>
              </div>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje
              </label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {selectedAlerta.mensaje}
              </p>
            </div>

            {/* Información del Trámite */}
            {selectedAlerta.tramite && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Información del Trámite Relacionado
                </h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Código:</strong> {selectedAlerta.tramite.codigo}
                    </div>
                    <div>
                      <strong>Ciudadano:</strong> {selectedAlerta.tramite.ciudadano?.nombres} {selectedAlerta.tramite.ciudadano?.apellidos}
                    </div>
                    <div>
                      <strong>DNI:</strong> {selectedAlerta.tramite.ciudadano?.dni}
                    </div>
                    <div>
                      <strong>Celular:</strong> {selectedAlerta.tramite.ciudadano?.celular}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Datos Adicionales */}
            {selectedAlerta.datosAdicionales && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Datos Adicionales
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedAlerta.datosAdicionales, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Acciones */}
            {!selectedAlerta.leidaGlobal && (
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cerrar
                </Button>
                <Button
                  icon={CheckCircle}
                  loading={resolverAlertaMutation.isLoading}
                  onClick={() => handleResolverAlerta(selectedAlerta._id, 'Alerta resuelta manualmente')}
                >
                  Marcar como Resuelta
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Alertas