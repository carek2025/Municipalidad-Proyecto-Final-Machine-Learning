import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertCircle, FileText, Upload } from 'lucide-react'
import Button from '../ui/Button'
import Alert from '../ui/Alert'
import { TRAMITE_TYPES } from '../../utils/constants'
import { formatTipoTramite } from '../../utils/formatters'
import { mlService } from '../../services/api'

const TramiteForm = ({ onSubmit, loading, onCancel }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [urgencyAnalysis, setUrgencyAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue
  } = useForm()

  const watchDescripcion = watch('descripcion')

  // Analizar urgencia cuando cambia la descripción
  React.useEffect(() => {
    const analyzeUrgency = async () => {
      if (watchDescripcion && watchDescripcion.length > 10) {
        setAnalyzing(true)
        try {
          const analysis = await mlService.predecirUrgencia(watchDescripcion)
          if (analysis.success) {
            setUrgencyAnalysis(analysis.prediction)
            // Auto-seleccionar prioridad basada en el análisis
            setValue('prioridad', analysis.prediction.priority)
          }
        } catch (error) {
          console.error('Error analizando urgencia:', error)
        } finally {
          setAnalyzing(false)
        }
      } else {
        setUrgencyAnalysis(null)
      }
    }

    const timeoutId = setTimeout(analyzeUrgency, 1000)
    return () => clearTimeout(timeoutId)
  }, [watchDescripcion, setValue])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmitForm = (data) => {
    const formData = {
      ...data,
      datosTramite: JSON.stringify({}),
      documentos: selectedFiles
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Tipo de Trámite */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Trámite *
        </label>
        <select
          {...register('tipo', { required: 'El tipo de trámite es requerido' })}
          className="input-primary"
        >
          <option value="">Seleccionar tipo de trámite</option>
          {Object.entries(TRAMITE_TYPES).map(([key, value]) => (
            <option key={key} value={value}>
              {formatTipoTramite(value)}
            </option>
          ))}
        </select>
        {errors.tipo && (
          <p className="text-red-600 text-sm mt-1">{errors.tipo.message}</p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción del Trámite *
        </label>
        <textarea
          {...register('descripcion', { 
            required: 'La descripción es requerida',
            minLength: {
              value: 10,
              message: 'La descripción debe tener al menos 10 caracteres'
            }
          })}
          rows={4}
          className="input-primary"
          placeholder="Describa detalladamente el trámite que desea realizar..."
        />
        {errors.descripcion && (
          <p className="text-red-600 text-sm mt-1">{errors.descripcion.message}</p>
        )}

        {/* Análisis de urgencia */}
        {analyzing && (
          <div className="flex items-center text-blue-600 text-sm mt-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            Analizando nivel de urgencia...
          </div>
        )}

        {urgencyAnalysis && !analyzing && (
          <div className={`p-3 rounded-lg text-sm mt-2 ${
            urgencyAnalysis.priority === 'URGENTE' ? 'bg-red-50 text-red-800 border border-red-200' :
            urgencyAnalysis.priority === 'ALTA' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <strong>Análisis de urgencia:</strong> {urgencyAnalysis.priority}
                {urgencyAnalysis.urgency_score > 0 && (
                  <span className="ml-2">
                    (Puntuación: {urgencyAnalysis.urgency_score})
                  </span>
                )}
              </div>
              {urgencyAnalysis.confidence && (
                <span className="text-xs">
                  Confianza: {(urgencyAnalysis.confidence * 100).toFixed(1)}%
                </span>
              )}
            </div>
            {urgencyAnalysis.found_keywords && urgencyAnalysis.found_keywords.length > 0 && (
              <div className="mt-1 text-xs">
                Palabras clave detectadas: {urgencyAnalysis.found_keywords.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prioridad (auto-seleccionada por ML) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prioridad
        </label>
        <select
          {...register('prioridad')}
          className="input-primary"
          disabled={analyzing}
        >
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
          <option value="BAJA">Baja</option>
        </select>
        <p className="text-gray-500 text-sm mt-1">
          La prioridad se sugiere automáticamente basada en el análisis de su descripción
        </p>
      </div>

      {/* Documentos adjuntos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Documentos Adjuntos
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Arrastre los documentos aquí o haga clic para seleccionar
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <label
            htmlFor="file-upload"
            className="btn-outline cursor-pointer"
          >
            Seleccionar Archivos
          </label>
        </div>

        {/* Lista de archivos seleccionados */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Archivos seleccionados ({selectedFiles.length})
            </p>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          Crear Trámite
        </Button>
      </div>
    </form>
  )
}

export default TramiteForm