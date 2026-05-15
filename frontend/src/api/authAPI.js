import apiClient from './client'

export const register = (email, password, phone) => 
  apiClient.post('/auth/register', { email, password, phone })

export const login = (email, password) => 
  apiClient.post('/auth/login', { email, password })

export const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('authUser')
}

export const refreshToken = (token) => 
  apiClient.post('/auth/refresh', { refreshToken: token })
