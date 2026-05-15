import apiClient from './client'

export const addToCart = (variantId, quantity) => 
  apiClient.post('/cart', { variantId, quantity })

export const removeFromCart = (itemId) => 
  apiClient.delete(`/cart/${itemId}`)

export const getCart = () => 
  apiClient.get('/cart')

export const updateCartItemQuantity = (variantId, quantity) =>
  apiClient.put(`/cart/${variantId}`, { quantity })

export const clearCart = () => 
  apiClient.delete('/cart')
