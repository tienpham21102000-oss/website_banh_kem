import apiClient from './client'

export const getAdminOrders = (params = {}) =>
  apiClient.get('/admin/orders', { params })

export const getAdminOrder = (orderId) =>
  apiClient.get(`/admin/orders/${orderId}`)

export const updateAdminOrderStatus = (orderId, status) =>
  apiClient.patch(`/admin/orders/${orderId}/status`, { status })

export const getAdminCategories = () =>
  apiClient.get('/admin/categories')

export const getAdminProducts = (params = {}) =>
  apiClient.get('/admin/products', { params })

export const createAdminProduct = (payload) =>
  apiClient.post('/admin/products', payload)

export const updateAdminProduct = (productId, payload) =>
  apiClient.patch(`/admin/products/${productId}`, payload)

export const createAdminVariant = (productId, payload) =>
  apiClient.post(`/admin/products/${productId}/variants`, payload)

export const updateAdminVariant = (variantId, payload) =>
  apiClient.patch(`/admin/variants/${variantId}`, payload)

export const deleteAdminVariant = (variantId) =>
  apiClient.delete(`/admin/variants/${variantId}`)

export const getAdminCoupons = (params = {}) =>
  apiClient.get('/admin/coupons', { params })

export const createAdminCoupon = (payload) =>
  apiClient.post('/admin/coupons', payload)

export const updateAdminCoupon = (couponId, payload) =>
  apiClient.patch(`/admin/coupons/${couponId}`, payload)

export const deleteAdminCoupon = (couponId) =>
  apiClient.delete(`/admin/coupons/${couponId}`)

export const getAdminStats = () =>
  apiClient.get('/admin/stats')
