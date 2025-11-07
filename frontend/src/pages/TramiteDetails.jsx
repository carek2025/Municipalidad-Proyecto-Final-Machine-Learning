import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowLeft, FileText, Calendar, User, MapPin, Phone, Mail, Download, Eye } from 'lucide-react'
import { tramitesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { formatDate, formatTipoTramite, formatEstado, formatPrioridad } from '../utils/formatters'

const TramiteDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: tramiteData, isLoading, error } = useQuery(
    ['tramite', id],
    () => tramitesAPI.getById(id),
    {
      enabled: !!id
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Cargando detalles del trámite..." />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="error" className="mx-auto max-w-4xl">
        Error cargando el trámite: {error.message}
        <div className="mt-4">
          <Button onClick={() => navigate('/tramites')} icon={ArrowLeft}>
            Volver a Trámites
          </Button>
        </div>
      </Alert>
    )
  }

  if (!tramiteData?.tramite) {
    return (
      <Alert variant="warning" className="mx-auto max-w-4xl">
        Trámite no encontrado
        <div className="mt-4">
          <Button onClick={() => navigate('/tramites')} icon={ArrowLeft}>
            Volver a Trámites
          </Button>
        </div>
      </Alert>
    )
  }

  const tramite = tramiteData.tramite

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate('/tramites')}
          >
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-title">
              Detalles del Trámite
            </h1>
            <p className="text-gray-600 mt-1">
              Información completa del trámite {tramite.codigo}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" icon={Download}>
            Descargar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Trámite */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Información del Trámite
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código
                </label>
                <p className="text-lg font-semibold text-gray-900">{tramite.codigo}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Trámite
                </label>
                <p className="text-lg font-semibold text-blue-600">
                  {formatTipoTramite(tramite.tipo)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <span className={`badge ${
                  tramite.estado === 'COMPLETADO' ? 'badge-completed' :
                  tramite.estado === 'EN_REVISION' ? 'badge-in-progress' :
                  tramite.estado === 'PENDIENTE' ? 'badge-pending' :
                  'badge-low'
                }`}>
                  {formatEstado(tramite.estado)}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <span className={`badge ${
                  tramite.prioridad === 'URGENTE' ? 'badge-urgent' :
                  tramite.prioridad === 'ALTA' ? 'badge-high' :
                  tramite.prioridad === 'MEDIA' ? 'badge-medium' :
                  'badge-low'
                }`}>
                  {formatPrioridad(tramite.prioridad)}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Fecha de Solicitud
                </label>
                <p className="text-gray-900">{formatDate(tramite.fechaSolicitud)}</p>
              </div>
              
              {tramite.fechaFinalizacion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha de Finalización
                  </label>
                  <p className="text-gray-900">{formatDate(tramite.fechaFinalizacion)}</p>
                </div>
              )}
            </div>
            
            {/* Descripción */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{tramite.descripcion}</p>
              </div>
            </div>
          </div>

          {/* Historial */}
          {tramite.historial && tramite.historial.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Historial del Trámite
              </h2>
              
              <div className="space-y-4">
                {tramite.historial.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-3 h-3 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`badge ${
                          item.estado === 'COMPLETADO' ? 'badge-completed' :
                          item.estado === 'EN_REVISION' ? 'badge-in-progress' :
                          item.estado === 'PENDIENTE' ? 'badge-pending' :
                          'badge-low'
                        }`}>
                          {formatEstado(item.estado)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(item.fecha)}
                        </span>
                      </div>
                      {item.observaciones && (
                        <p className="text-gray-700 text-sm">{item.observaciones}</p>
                      )}
                      {item.funcionario && (
                        <p className="text-xs text-gray-500 mt-1">
                          Por: {item.funcionario.nombres} {item.funcionario.apellidos}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información del Ciudadano */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-6 w-6 mr-2 text-green-600" />
              Información del Ciudadano
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <p className="text-gray-900">
                  {tramite.ciudadano?.nombres} {tramite.ciudadano?.apellidos}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  DNI
                </label>
                <p className="text-gray-900">{tramite.ciudadano?.dni}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Celular
                </label>
                <p className="text-gray-900">{tramite.ciudadano?.celular}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Dirección
                </label>
                <p className="text-gray-900">{tramite.ciudadano?.direccion}</p>
                <p className="text-sm text-gray-600">{tramite.ciudadano?.distrito}</p>
              </div>
            </div>
          </div>

          {/* Documentos Adjuntos */}
          {tramite.documentosAdjuntos && tramite.documentosAdjuntos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Documentos Adjuntos
              </h2>
              
              <div className="space-y-3">
                {tramite.documentosAdjuntos.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {(doc.tamaño / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" icon={Eye}>
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información de ML */}
          {tramite.puntuacionUrgencia && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Análisis de Urgencia
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puntuación de Urgencia
                  </label>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${tramite.puntuacionUrgencia}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {tramite.puntuacionUrgencia}% de urgencia
                  </p>
                </div>
                
                {tramite.palabrasClaveUrgencia && tramite.palabrasClaveUrgencia.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Palabras Clave Detectadas
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tramite.palabrasClaveUrgencia.map((palabra, index) => (
                        <span key={index} className="badge badge-medium text-xs">
                          {palabra}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TramiteDetails
