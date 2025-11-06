import React, { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('municipalidad_token'))

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const userData = await authAPI.verifyToken()
          setUser(userData)
        } catch (error) {
          console.error('Error verificando token:', error)
          localStorage.removeItem('municipalidad_token')
          setToken(null)
        }
      }
      setLoading(false)
    }

    verifyToken()
  }, [token])

  const login = async (dni, password) => {
    try {
      const response = await authAPI.login(dni, password)
      
      if (response.success) {
        const { token: newToken, user: userData } = response
        
        localStorage.setItem('municipalidad_token', newToken)
        setToken(newToken)
        setUser(userData)
        
        return { success: true, user: userData }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Error en login:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error de conexión con el servidor' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      
      if (response.success) {
        const { token: newToken, user: registeredUser } = response
        
        localStorage.setItem('municipalidad_token', newToken)
        setToken(newToken)
        setUser(registeredUser)
        
        return { success: true, user: registeredUser }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Error en registro:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error de conexión con el servidor' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('municipalidad_token')
    setToken(null)
    setUser(null)
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      if (response.success) {
        setUser(response.user)
        return { success: true, user: response.user }
      }
      return { success: false, error: response.error }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error actualizando perfil' 
      }
    }
  }

  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData)
      return response
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error cambiando contraseña' 
      }
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    loading,
    isAuthenticated: !!user,
    userRole: user?.rol,
    userArea: user?.area
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}