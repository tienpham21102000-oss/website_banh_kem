import apiClient from './client'

export const getAvailableSlots = (productId) => 
  apiClient.get('/delivery/available-slots', { params: { productId } })

export const validateDeliveryWindow = (productId, date, time) => 
  apiClient.post('/delivery/validate', { productId, date, time })
