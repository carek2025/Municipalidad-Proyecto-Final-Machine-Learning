import React from 'react'
import { Eye, Clock, AlertTriangle, User, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import Button from '../ui/Button'
import { reportesAPI } from '../../services/api'
import { formatDate, formatTipoTramite, formatEstado, formatPrioridad } from '../../utils/formatters'

const TramitesTable = ({ tramites, currentPage, totalPages, onPageChange, userRole }) => {
  const queryClient = useQueryClient()

  // Mutación para descargar PDF
  const downloadPDFMutation = useMutation(reportesAPI.descargarPDF, {
    onSuccess: (data, tramiteId) => {
      // Crear blob y descargar
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tramite_${tramiteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  })

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
        return 'badge-completed'
      case 'EN_REVISION':
        return 'badge-in-progress'
      case 'PENDIENTE':
        return 'badge-pending'
      case 'RECHAZADO':
        return 'badge-urgent'
      default:
        return 'badge-low'
    }
  }

  const getPriorityBadge = (prioridad) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'badge-urgent'
      case 'ALTA':
        return 'badge-high'
      case 'MEDIA':
        return 'badge-medium'
      case 'BAJA':
        return 'badge-low'
      default:
        return 'badge-low'
    }
  }

  const handleDownloadPDF = (tramiteId) => {
    downloadPDFMutation.mutate(tramiteId)
  }

  const canAssignTramite = (tramite) => {
    return userRole !== 'ciudadano' && 
           tramite.estado === 'PENDIENTE' && 
           !tramite.funcionarioAsignado
  }

  const canDownloadPDF = (tramite) => {
    if (userRole === 'ciudadano') {
      return tramite.estado === 'COMPLETADO' || tramite.estado === 'APROBADO'
    }
    return true // El personal puede descargar cualquier trámite
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Lista de Trámites ({tramites.length})
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trámite
              </th>
              {userRole !== 'ciudadano' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciudadano
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioridad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              {userRole !== 'ciudadano' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asignado a
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tramites.length === 0 ? (
              <tr>
                <td 
                  colSpan={userRole !== 'ciudadano' ? 7 : 5} 
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No se encontraron trámites
                </td>
              </tr>
            ) : (
              tramites.map((tramite) => (
                <tr key={tramite._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPriorityIcon(tramite.prioridad)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {tramite.codigo}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTipoTramite(tramite.tipo)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {userRole !== 'ciudadano' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tramite.ciudadano?.nombres} {tramite.ciudadano?.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">
                            {tramite.ciudadano?.dni}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusColor(tramite.estado)}`}>
                      {formatEstado(tramite.estado)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getPriorityBadge(tramite.prioridad)}`}>
                      {formatPrioridad(tramite.prioridad)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(tramite.fechaSolicitud)}
                  </td>
                  
                  {userRole !== 'ciudadano' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tramite.funcionarioAsignado ? (
                        <div>
                          <div className="font-medium">
                            {tramite.funcionarioAsignado.nombres} {tramite.funcionarioAsignado.apellidos}
                          </div>
                          <div className="text-xs text-gray-400">
                            {tramite.funcionarioAsignado.cargo}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin asignar</span>
                      )}
                    </td>
                  )}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link to={`/tramites/${tramite._id}`}>
  			<Button variant="outline" size="sm" icon={Eye}>
  			  Ver detalles
  			</Button>
		      </Link>                      
                      {canDownloadPDF(tramite) && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Download}
                          loading={downloadPDFMutation.isLoading && downloadPDFMutation.variables === tramite._id}
                          onClick={() => handleDownloadPDF(tramite._id)}
                          title="Descargar PDF"
                        >
                          PDF
                        </Button>
                      )}
                      
                      {canAssignTramite(tramite) && (
                        <Button size="sm">
                          Asignar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página <span className="font-medium">{currentPage}</span> de{' '}
              <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TramitesTable
