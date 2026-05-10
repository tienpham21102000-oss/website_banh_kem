import axios from 'axios'

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const storedRefreshToken = localStorage.getItem('refreshToken')

    if (
      error.response?.status === 401 &&
      storedRefreshToken &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/')
    ) {
      originalRequest._retry = true

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        })
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('refreshToken', data.refreshToken)
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('authUser')
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
