import apiClient from './client'

export const initiateVNPayment = (orderId) => 
  apiClient.post('/payments/vnpay/checkout', { orderId })

export const checkPaymentStatus = (orderId) => 
  apiClient.get(`/payments/status/${orderId}`)
