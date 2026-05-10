import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { checkPaymentStatus } from '../api/paymentAPI'
import { formatCurrency, getErrorMessage } from '../utils/helpers'

const responseMessages = {
  '00': 'Thanh toan thanh cong.',
  '24': 'Giao dich da bi huy boi nguoi dung.',
}

export default function CheckoutReturn({ session }) {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState({
    loading: true,
    payment: null,
    orderId: searchParams.get('vnp_TxnRef') || '',
    responseCode: searchParams.get('vnp_ResponseCode') || '',
    error: '',
  })

  useEffect(() => {
    const orderId = searchParams.get('vnp_TxnRef')

    if (!orderId) {
      setStatus({
        loading: false,
        payment: null,
        orderId: '',
        responseCode: '',
        error: 'Khong tim thay ma don hang trong duong dan tra ve.',
      })
      return
    }

    if (!session.token) {
      setStatus({
        loading: false,
        payment: null,
        orderId,
        responseCode: searchParams.get('vnp_ResponseCode') || '',
        error: 'Can dang nhap lai de kiem tra trang thai thanh toan.',
      })
      return
    }

    const loadPaymentStatus = async () => {
      try {
        const { data } = await checkPaymentStatus(orderId)
        setStatus({
          loading: false,
          payment: data,
          orderId,
          responseCode: searchParams.get('vnp_ResponseCode') || '',
          error: '',
        })
      } catch (error) {
        const message = getErrorMessage(error, 'Khong the tai trang thai thanh toan')
        toast.error(message)
        setStatus({
          loading: false,
          payment: null,
          orderId,
          responseCode: searchParams.get('vnp_ResponseCode') || '',
          error: message,
        })
      }
    }

    loadPaymentStatus()
  }, [searchParams, session.token])

  const friendlyMessage = responseMessages[status.responseCode] || (
    status.responseCode
      ? `VNPay tra ve ma ${status.responseCode}. Hay kiem tra lai trang thai don hang.`
      : 'Dang doi backend xac nhan ket qua thanh toan.'
  )

  if (status.loading) {
    return <div className="empty-card">Dang kiem tra trang thai thanh toan...</div>
  }

  return (
    <div className="checkout-layout">
      <section className="checkout-form">
        <div className="section-heading">
          <div>
            <p className="eyebrow">VNPay Return</p>
            <h2>Ket qua thanh toan</h2>
          </div>
        </div>

        {status.error ? (
          <div className="empty-card">
            <p>{status.error}</p>
            <p>{friendlyMessage}</p>
          </div>
        ) : (
          <div className="summary-card">
            <div className="summary-row">
              <span>Ma don hang</span>
              <strong>{status.orderId}</strong>
            </div>
            <div className="summary-row">
              <span>Trang thai don</span>
              <strong>{status.payment?.status || 'unknown'}</strong>
            </div>
            <div className="summary-row">
              <span>Trang thai thanh toan</span>
              <strong>{status.payment?.paymentStatus || 'unknown'}</strong>
            </div>
            {status.payment?.payment?.amount ? (
              <div className="summary-row">
                <span>So tien</span>
                <strong>{formatCurrency(status.payment.payment.amount)}</strong>
              </div>
            ) : null}
            <p className="summary-note">{friendlyMessage}</p>
          </div>
        )}

        <div className="cart-layout">
          <Link to="/checkout" className="primary-link">
            Quay lai checkout
          </Link>
          <Link to="/cart" className="primary-link">
            Xem gio hang
          </Link>
        </div>
      </section>
    </div>
  )
}
