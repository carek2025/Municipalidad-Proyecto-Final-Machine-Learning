import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileSidebar from './MobileSidebar'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="flex h-screen bg-municipal-background">
      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Sidebar móvil */}
      <MobileSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Contenido de la página */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout