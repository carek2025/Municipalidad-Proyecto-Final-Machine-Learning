import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Search, Filter, Download, Upload } from 'lucide-react'
import { tramitesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Modal from '../components/ui/Modal'
import TramiteForm from '../components/tramites/TramiteForm'
import TramitesTable from '../components/tramites/TramitesTable'
import FiltersPanel from '../components/tramites/FiltersPanel'
import { TRAMITE_TYPES, TRAMITE_STATUS, PRIORITY_LEVELS } from '../utils/constants'

const Tramites = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    prioridad: '',
    page: 1,
    limit: 10,
    search: ''
  })

  // Fetch trámites con filtros
  const {
    data: tramitesData,
    isLoading,
    error
  } = useQuery(['tramites', filters], () => tramitesAPI.getAll(filters), {
    keepPreviousData: true,
    staleTime: 30000,
  })

  // Mutación para crear trámite
  const createTramiteMutation = useMutation(tramitesAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tramites'])
      setShowCreateModal(false)
    }
  })

  const handleCreateTramite = async (tramiteData) => {
    await createTramiteMutation.mutateAsync(tramiteData)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const tramites = tramitesData?.tramites || []
  const pagination = tramitesData?.pagination || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-title">
            Gestión de Trámites
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.rol === 'ciudadano' 
              ? 'Mis trámites y solicitudes' 
              : 'Administración de trámites municipales'
            }
          </p>
        </div>

        {user?.rol === 'ciudadano' && (
          <Button
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
            className="whitespace-nowrap"
          >
            Nuevo Trámite
          </Button>
        )}
      </div>

      {/* Panel de Filtros */}
      <FiltersPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        showAdvancedFilters={user?.rol !== 'ciudadano'}
      />

      {/* Estado de carga y errores */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner size="lg" text="Cargando trámites..." />
        </div>
      )}

      {error && (
        <Alert variant="error">
          Error cargando los trámites: {error.message}
        </Alert>
      )}

      {/* Tabla de trámites */}
      {!isLoading && !error && (
        <TramitesTable
          tramites={tramites}
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
          userRole={user?.rol}
        />
      )}

      {/* Modal para crear trámite */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Trámite"
        size="lg"
      >
        <TramiteForm
          onSubmit={handleCreateTramite}
          loading={createTramiteMutation.isLoading}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  )
}

export default Tramites