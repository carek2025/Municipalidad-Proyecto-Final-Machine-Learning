import React from 'react'
import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-700'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-700'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-700'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      text: 'text-yellow-700'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      text: 'text-purple-700'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      text: 'text-orange-700'
    }
  }

  const { bg, icon: iconColor, text } = colorClasses[color]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          
          {trend && (
            <div className="flex items-center">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs último mes</span>
            </div>
          )}
          
          {description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-lg ${bg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricCard