import apiClient from './client'

export const validateCoupon = (code) => 
  apiClient.post('/coupons/validate', { code })

export const applyCoupon = (code, cartTotal) => 
  apiClient.post('/coupons/apply', { code, cartTotal })

export const getActiveCoupons = () => 
  apiClient.get('/coupons')

export const getMonthlyCoupons = getActiveCoupons
