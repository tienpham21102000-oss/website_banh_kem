# Hướng Dẫn Deployment

## 📦 Production Checklist

- [ ] Environment variables configured for production
- [ ] SSL/HTTPS enabled
- [ ] Database backups configured
- [ ] Monitoring & alerting setup
- [ ] VNPay production credentials obtained
- [ ] Email service tested
- [ ] CDN configured for images
- [ ] Rate limiting enabled
- [ ] Logging & error tracking active
- [ ] Security headers configured

## 🏥 Health Check

```bash
GET /health
Response: { "status": "ok", "timestamp": "2026-05-02T..." }
```

## 🔧 Configuration for Production

### Backend (.env.production)
```
NODE_ENV=production
PORT=5000
DB_HOST=prod-db.example.com
DB_PASSWORD=[use-secure-password]
JWT_SECRET=[use-strong-random-secret]
VNPAY_TMN_CODE=[production-code]
VNPAY_HASH_SECRET=[production-secret]
VNPAY_API_URL=https://api.vnpayment.vn
```

### Database
- Enable SSL connections
- Setup automated backups (daily)
- Test restore procedure
- Set connection limits

### Monitoring
- Setup error alerts (Appsignal, Sentry)
- Monitor API response times
- Track failed payments
- Setup uptime monitoring

---

See main README.md for more details.
