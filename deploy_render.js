const https = require('https');
const crypto = require('crypto');

const API_KEY = 'rnd_4ZCy8BGVm0FL3Yyrg26bht5GKIKa';
const OWNER_ID = 'tea-d7uaacd0lvsc73esbhtg';

function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== DEPLOY LÊN RENDER - TẠO WEB SERVICE ===\n');

  // Build database URL
  const host = 'dpg-d81kn9tckfvc73fknlc0-a.singapore-postgres.render.com';
  const dbUrl = `postgresql://banh_kem_user:BanhKemDb2026!@${host}:5432/banh_kem_db_bhu1`;
  console.log(`✅ Database URL: ${dbUrl}`);

  // Generate secrets
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
  const sessionSecret = crypto.randomBytes(64).toString('hex');
  
  console.log(`✅ JWT secrets generated`);

  // Step 2: Create Web Service with CORRECT Render API format
  console.log('\n📦 Tạo Web Service...');
  
  const serviceResult = await apiCall('POST', '/v1/services', {
    type: 'web_service',
    name: 'banh-kem',
    ownerId: OWNER_ID,
    repo: 'https://github.com/tienpham21102000-oss/website_banh_kem',
    branch: 'main',
    serviceDetails: {
      runtime: 'node',
      buildCommand: 'npm run install:all && npm run build:frontend',
      startCommand: 'npm start',
      plan: 'free',
      region: 'singapore',
      envSpecificDetails: {
        buildEnvVars: [],
        startEnvVars: [
          { key: 'NODE_ENV', value: 'production' },
          { key: 'DATABASE_URL', value: dbUrl },
          { key: 'PGSSLMODE', value: 'require' },
          { key: 'JWT_SECRET', value: jwtSecret },
          { key: 'JWT_REFRESH_SECRET', value: jwtRefreshSecret },
          { key: 'SESSION_SECRET', value: sessionSecret },
          { key: 'API_BASE_URL', value: 'https://banh-kem.onrender.com' },
          { key: 'FRONTEND_URL', value: 'https://banh-kem.onrender.com' },
          { key: 'FACEBOOK_APP_ID', value: '2235435903938309' },
          { key: 'FACEBOOK_APP_SECRET', value: 'ee049bf32b130a58d267b7e7b79afd19' },
          { key: 'ADMIN_EMAIL', value: 'admin@banhkem.com' },
          { key: 'ADMIN_PASSWORD', value: 'admin123' },
        ],
      },
    },
  });
  
  console.log('\n📋 Response:', JSON.stringify(serviceResult, null, 2));
  
  if (serviceResult.message) {
    console.log('\n⚠️ Lỗi:', serviceResult.message);
    return;
  }
  
  console.log('\n✅ Web Service đã được tạo!');
  const serviceId = serviceResult.service?.id || serviceResult.id;
  console.log(`📌 Dashboard: https://dashboard.render.com/web/${serviceId}`);
  console.log(`🌐 URL: https://banh-kem.onrender.com`);
  console.log('\n⏳ Đợi 3-5 phút cho build hoàn tất...');
  console.log('Sau đó vào Shell tab và chạy:');
  console.log('  cd backend && npm run migrate && npm run seed');
}

main().catch(console.error);