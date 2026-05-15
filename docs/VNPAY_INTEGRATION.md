# VNPay Integration Guide

## Overview

VNPay is the primary payment gateway for bánh kem ordering website. This guide covers the integration details including sandbox setup, payment flow, IPN handling, and security measures.

## 📋 Table of Contents
1. [Sandbox Setup](#sandbox-setup)
2. [Payment Flow](#payment-flow)
3. [IPN Webhook](#ipn-webhook)
4. [Signature Validation](#signature-validation)
5. [Testing](#testing)
6. [Production](#production)

## Sandbox Setup

### Register Account
1. Go to https://sandbox.vnpayment.vn/
2. Sign up for merchant account
3. You'll receive:
   - `TMN_CODE` (Merchant Code)
   - `HASH_SECRET` (Security key)

### Configure URLs
In VNPay merchant portal, set:
- **Return URL:** `http://localhost:3000/checkout/return`
- **Notify URL:** `http://localhost:5000/api/payments/vnpay/ipn`

Update `.env`:
```
VNPAY_TMN_CODE=your_sandbox_merchant_code
VNPAY_HASH_SECRET=your_sandbox_hash_secret
VNPAY_API_URL=https://sandbox.vnpayment.vn
```

## Payment Flow

### 1. User Initiates Payment
```
User selects VNPay on checkout
↓
POST /api/payments/vnpay/checkout
{
  orderId: "ORD-20260502-001",
  amount: 500000,
  orderInfo: "Bánh kem tùy chỉnh"
}
```

### 2. Backend Generates VNPay URL
```javascript
// Backend: PaymentService.js
1. Create Payment record (status: pending)
2. Build VNPay request with HMAC-SHA512 signature
3. Generate redirect URL
4. Return URL to frontend
```

**VNPay Request Fields:**
- `tmnCode` - Merchant code
- `amount` - Amount in VND × 100 (500000 VND → 50000000)
- `createDate` - Request timestamp (YYYYMMDDHHmmss)
- `expireDate` - Payment deadline
- `orderInfo` - Order description
- `orderType` - Transaction type (always 100000 for payment)
- `returnUrl` - Redirect after payment
- `secure_hash` - HMAC-SHA512 Signature

### 3. User Redirected to VNPay
- User confirms payment on VNPay portal
- Completes payment

### 4. VNPay Redirects to Return URL
```
Redirect: http://localhost:3000/checkout/return?vnp_ResponseCode=00&vnp_TransactionNo=...
```

### 5. Frontend Polls Order Status
```javascript
// Frontend checks order status periodically
GET /api/orders/{orderId}
Response: { status: "pending", paymentStatus: "pending" }
```

### 6. VNPay Sends IPN Webhook (Async)
```
POST http://localhost:5000/api/payments/vnpay/ipn
{
  vnp_ResponseCode: "00",  // Success
  vnp_TransactionNo: "123456789",
  vnp_Amount: "50000000",
  ...
  secure_hash: "..."
}
```

### 7. Backend Processes IPN
```
1. Validate signature (critical!)
2. Parse response code
3. If vnp_ResponseCode === "00": Order status → "paid"
4. Reserve inventory
5. Send confirmation email
6. Return HTTP 200 to VNPay
```

### 8. Frontend Refreshes & Shows Success
```
Order detail page now shows: ✓ Payment Confirmed
```

## IPN Webhook

### Endpoint
```
POST /api/payments/vnpay/ipn
```

### Characteristics
- **NO authentication** (VNPay cannot authenticate)
- Must validate via **HMAC-SHA512 signature only**
- Can receive **multiple times** for same transaction
- Must be **idempotent** (duplicate IPN → no error)

### Response
Always return HTTP 200:
```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

### Implementation
```javascript
// Backend: paymentController.js
async handleVNPayIPN(req, res) {
  try {
    // 1. Validate signature
    if (!validateVNPaySignature(req.body)) {
      return res.status(400).json({ RspCode: "97" });
    }

    const { vnp_ResponseCode, vnp_TransactionNo, vnp_Amount, vnp_OrderInfo } = req.body;

    // 2. Check if payment already processed (idempotency)
    const existingPayment = await Payment.findOne({ 
      gateway_transaction_id: vnp_TransactionNo 
    });
    if (existingPayment) {
      return res.json({ RspCode: "00" });
    }

    // 3. Process payment
    if (vnp_ResponseCode === "00") {
      // Update Payment & Order status
      // Reserve inventory
      // Send email
    }

    return res.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    console.error("IPN Error:", error);
    return res.json({ RspCode: "99" }); // 99 = Unknown error
  }
}
```

## Signature Validation

### HMAC-SHA512

VNPay uses HMAC-SHA512 for request signing and IPN validation.

```javascript
// Backend: vnpay-helper.js

const crypto = require('crypto');

function buildVNPaySignature(params, hashSecret) {
  // Sort parameters
  const sortedKeys = Object.keys(params).sort();
  
  let signData = '';
  for (let key of sortedKeys) {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      signData += key + '=' + encodeURIComponent(params[key]) + '&';
    }
  }
  signData = signData.slice(0, -1); // Remove trailing '&'

  // Generate HMAC-SHA512
  const hash = crypto
    .createHmac('sha512', hashSecret)
    .update(signData)
    .digest('hex');

  return hash;
}

function validateVNPaySignature(params, hashSecret) {
  const receivedHash = params.vnp_SecureHash;
  
  // Remove hash & SecureHashType from params for verification
  const { vnp_SecureHash, vnp_SecureHashType, ...verifyParams } = params;

  const calculatedHash = buildVNPaySignature(verifyParams, hashSecret);
  
  return receivedHash === calculatedHash;
}

module.exports = { buildVNPaySignature, validateVNPaySignature };
```

### Critical Security Points
1. **Never expose HASH_SECRET** in frontend/frontend code
2. **Always validate signature** on IPN
3. **Check transaction date** (prevent replay attacks)
4. **Verify amount** matches order total
5. **Use HTTPS** in production

## Testing

### Manual Testing (Sandbox)

1. **Create Test Order**
   ```bash
   POST http://localhost:5000/api/orders
   {
     "items": [{ "variantId": "xxx", "quantity": 1 }],
     "shippingAddress": "...",
     "deliveryDate": "2026-05-10"
   }
   Response: { orderId: "ORD-xxx" }
   ```

2. **Initiate Payment**
   ```bash
   POST http://localhost:5000/api/payments/vnpay/checkout
   { "orderId": "ORD-xxx" }
   Response: { redirectUrl: "https://sandbox.vnpayment.vn/..." }
   ```

3. **Complete Payment on VNPay Portal**
   - Scan provided QR code or enter test card
   - Test cards:
     - Visa: `9704 1234 5678 9010`
     - Confirmation code: Any 6 digits
   - Verify signature on returned URL

4. **Check Order Status**
   ```bash
   GET http://localhost:5000/api/orders/ORD-xxx
   Response: { status: "paid", paymentStatus: "completed" }
   ```

5. **Monitor IPN Webhook**
   - Check backend logs: `[IPN] Payment received from VNPay`
   - Verify Order updated within seconds
   - Check email inbox for confirmation

### Unit Tests

```javascript
// Backend: tests/payment.test.js

test('VNPay signature validation - valid', () => {
  const params = { /* valid params */ };
  const isValid = validateVNPaySignature(params, HASH_SECRET);
  expect(isValid).toBe(true);
});

test('VNPay IPN handling - idempotent', async () => {
  const ipnData = { /* IPN payload */ };
  
  // First call
  const res1 = await handleVNPayIPN(ipnData);
  expect(res1.status).toBe(200);
  
  // Second call (duplicate)
  const res2 = await handleVNPayIPN(ipnData);
  expect(res2.status).toBe(200); // Should not error
  
  // Verify only one Payment record created
  const count = await Payment.count({ gateway_transaction_id: ipnData.vnp_TransactionNo });
  expect(count).toBe(1);
});
```

## Production

### VNPay Production Setup

1. **Submit Merchant Registration**
   - Provide business documents
   - Wait for approval (2-3 business days)

2. **Get Production Credentials**
   ```
   VNPAY_TMN_CODE=your_production_merchant_code
   VNPAY_HASH_SECRET=your_production_hash_secret
   VNPAY_API_URL=https://api.vnpayment.vn
   ```

3. **Update Environment**
   ```bash
   # .env.production
   VNPAY_API_URL=https://api.vnpayment.vn
   VNPAY_RETURN_URL=https://yourdomain.com/checkout/return
   VNPAY_NOTIFY_URL=https://api.yourdomain.com/api/payments/vnpay/ipn
   ```

4. **Enable HTTPS**
   - SSL certificate required
   - All endpoints must use HTTPS

5. **Update DNS & Reverse Proxy**
   - Point domain to production server
   - Configure reverse proxy (Nginx)

### Monitoring

Store payment metrics:
```javascript
// Dashboard metrics
- Total payments: 1,250
- Success rate: 98.5%
- Average time to confirmation: 2.3 seconds
- Failed payments: 18
- Refunded: 5
```

### Common Issues

| Issue | Solution |
|-------|----------|
| IPN not received | Check notify URL public + HTTPS |
| Signature validation fails | Verify HASH_SECRET hasn't changed |
| Duplicate payments | Ensure idempotency in IPN handler |
| Payment pending forever | Check order status polling + IPN backup |

---

**Last Updated:** May 2, 2026
