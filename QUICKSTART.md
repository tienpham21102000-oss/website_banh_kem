# Quick Start Guide

## 🚀 First Time Setup

### 1. Start Docker Services
```bash
docker-compose up -d
```

Wait for both services to be healthy:
```bash
docker-compose ps
```

Expected output:
```
NAME                STATUS              
banh_kem_postgres   Up (healthy)
banh_kem_redis      Up (healthy)
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Setup Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env and set VNPAY credentials (use sandbox values for development)
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Update VITE_API_URL if needed
```

### 4. Run Database Migrations

```bash
cd backend
npm run migrate
```

Expected output:
```
Starting database migrations...
Running migration: 001-init-schema.sql
✓ Migration 001-init-schema.sql completed
✓ All migrations completed successfully!
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Output:
```
[INFO] ... - Server running on port 5000 in development mode
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Output:
```
VITE v4.3.4  ready in 123 ms

➜  Local:   http://localhost:3000/
➜  Press h to show help
```

### 6. Verify Setup

1. **Backend Health:**
   ```bash
   curl http://localhost:5000/health
   ```
   Expected: `{"status":"ok","timestamp":"2026-05-02T..."}`

2. **Frontend:**
   Open http://localhost:3000 - Should show placeholder pages

## 📋 Check Services

### PostgreSQL
```bash
# Connect to database
docker exec -it banh_kem_postgres psql -U banh_kem_user -d banh_kem_db

# View tables
\dt

# Exit
\q
```

### Redis
```bash
# Check Redis connection
docker exec -it banh_kem_redis redis-cli ping
# Expected: PONG
```

## 🛑 Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (be careful - removes data!)
docker-compose down -v
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connection Error
```bash
# Check if Docker is running
docker ps

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Not Connecting
```bash
# Restart Redis
docker-compose restart redis

# Check Redis logs
docker-compose logs redis
```

### Migration Failed
```bash
# Check migration on database
# Log into PostgreSQL and verify schema exists
docker exec -it banh_kem_postgres psql -U banh_kem_user -d banh_kem_db -c "\dt"

# Try migration again
cd backend
npm run migrate
```

## 📚 Next Steps

1. **Backend Development (Phase 2):**
   - Implement ProductService
   - Build Cart service with Redis
   - Create OrderService
   - Build PaymentService (VNPay integration)
   - Setup Authentication

2. **Frontend Development (Phase 3):**
   - Build Catalog page
   - Create Shopping Cart UI
   - Build Multi-step Checkout
   - Implement Payment flow
   - Create Order History page

3. **Testing & Deployment (Phase 4-5):**
   - Test VNPay sandbox
   - Admin panel development
   - Production deployment

---

**Ready to start? Begin with Phase 2 backend development!**
