import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = ''
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} ${className} animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                icon={X}
                className="!p-2"
              />
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal