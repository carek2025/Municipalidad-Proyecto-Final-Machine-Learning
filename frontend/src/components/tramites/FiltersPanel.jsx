import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import Button from '../ui/Button'
import { TRAMITE_TYPES, TRAMITE_STATUS, PRIORITY_LEVELS } from '../../utils/constants'
import { formatTipoTramite, formatEstado, formatPrioridad } from '../../utils/formatters'

const FiltersPanel = ({ filters, onFilterChange, showAdvancedFilters = false }) => {
  const handleSearchChange = (e) => {
    onFilterChange({ search: e.target.value })
  }

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value })
  }

  const clearFilters = () => {
    onFilterChange({
      tipo: '',
      estado: '',
      prioridad: '',
      search: ''
    })
  }

  const hasActiveFilters = filters.tipo || filters.estado || filters.prioridad || filters.search

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Búsqueda */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar trámites..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="input-primary pl-10"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {showAdvancedFilters && (
            <>
              <select
                value={filters.tipo || ''}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
                className="input-primary min-w-[180px]"
              >
                <option value="">Todos los tipos</option>
                {Object.values(TRAMITE_TYPES).map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {formatTipoTramite(tipo)}
                  </option>
                ))}
              </select>

              <select
                value={filters.estado || ''}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="input-primary min-w-[180px]"
              >
                <option value="">Todos los estados</option>
                {Object.values(TRAMITE_STATUS).map((estado) => (
                  <option key={estado} value={estado}>
                    {formatEstado(estado)}
                  </option>
                ))}
              </select>
            </>
          )}

          <select
            value={filters.prioridad || ''}
            onChange={(e) => handleFilterChange('prioridad', e.target.value)}
            className="input-primary min-w-[180px]"
          >
            <option value="">Todas las prioridades</option>
            {Object.values(PRIORITY_LEVELS).map((prioridad) => (
              <option key={prioridad} value={prioridad}>
                {formatPrioridad(prioridad)}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              icon={X}
              onClick={clearFilters}
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FiltersPanel