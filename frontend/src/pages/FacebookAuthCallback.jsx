import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import apiClient from '../api/client'

export default function FacebookAuthCallback({ onAuth }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const error = params.get('error')
        if (error) {
          toast.error('Đăng nhập Facebook thất bại. Vui lòng thử lại.')
          navigate('/', { replace: true })
          return
        }

        const token = params.get('token')
        const refreshToken = params.get('refreshToken')

        if (!token) {
          toast.error('Thiếu thông tin đăng nhập. Vui lòng thử lại.')
          navigate('/', { replace: true })
          return
        }

        localStorage.setItem('authToken', token)
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken)

        const { data: user } = await apiClient.get('/auth/me')

        onAuth?.({ token, refreshToken, user })
        toast.success('Đăng nhập Facebook thành công')
        navigate('/', { replace: true })
      } catch (e) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('authUser')
        toast.error('Không thể hoàn tất đăng nhập Facebook. Vui lòng thử lại.')
        navigate('/', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [navigate, onAuth, params])

  return (
    <div className="not-found" style={{ padding: '60px 20px' }}>
      {loading ? 'Đang đăng nhập bằng Facebook...' : 'Đang chuyển hướng...'}
    </div>
  )
}

