import React from 'react'
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'

const Alert = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = ''
}) => {
  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-400',
      text: 'text-blue-800',
      title: 'text-blue-800'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-400',
      text: 'text-green-800',
      title: 'text-green-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-400',
      text: 'text-yellow-800',
      title: 'text-yellow-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: XCircle,
      iconColor: 'text-red-400',
      text: 'text-red-800',
      title: 'text-red-800'
    }
  }

  const { bg, border, icon: Icon, iconColor, text, title: titleColor } = variants[variant]

  return (
    <div className={`rounded-lg border p-4 ${bg} ${border} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${titleColor}`}>
              {title}
            </h3>
          )}
          {children && (
            <div className={`text-sm mt-2 ${text}`}>
              {children}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 hover:bg-${variant}-100 focus:outline-none focus:ring-2 focus:ring-${variant}-500 focus:ring-offset-2 focus:ring-offset-${variant}-50`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Alert