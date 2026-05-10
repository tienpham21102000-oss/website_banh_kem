import apiClient from './client'

export const createOrder = (orderData) => 
  apiClient.post('/orders', orderData)

export const getOrder = (orderId) => 
  apiClient.get(`/orders/${orderId}`)

export const getOrders = () => 
  apiClient.get('/orders')
