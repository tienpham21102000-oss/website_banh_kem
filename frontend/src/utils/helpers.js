export const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

export const parseFormData = (formData) => {
  const data = {}
  formData.forEach((value, key) => {
    if (key in data) {
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]]
      }
      data[key].push(value)
    } else {
      data[key] = value
    }
  })
  return data
}

export const calculateDeliveryDeadline = (minHours) => {
  const deadline = new Date()
  deadline.setHours(deadline.getHours() + minHours)
  return deadline
}

export const getErrorMessage = (error, fallback = 'Đã xảy ra lỗi') => {
  return error?.response?.data?.error || error?.message || fallback
}
