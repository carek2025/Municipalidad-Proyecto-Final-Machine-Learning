import React from 'react'
import { Loader } from 'lucide-react'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  text = null,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const colorClasses = {
    primary: 'text-municipal-primary',
    white: 'text-white',
    gray: 'text-gray-500'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader 
          className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} 
        />
        {text && (
          <p className="text-sm text-gray-600 animate-pulse">{text}</p>
        )}
      </div>
    </div>
  )
}

export default LoadingSpinner