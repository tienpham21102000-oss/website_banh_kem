import apiClient from './client'

export const getProducts = () => apiClient.get('/products')
export const getProductById = (id) => apiClient.get(`/products/${id}`)
export const getCategories = () => apiClient.get('/products/categories')
export const searchProducts = (query) => apiClient.get('/products', { params: { search: query } })
