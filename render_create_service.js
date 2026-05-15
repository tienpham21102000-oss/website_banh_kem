const https = require('https');
const crypto = require('crypto');

const API_KEY = 'rnd_4ZCy8BGVm0FL3Yyrg26bht5GKIKa';
const OWNER_ID = 'tea-d7uaacd0lvsc73esbhtg';

const host = 'dpg-d81kn9tckfvc73fknlc0-a.singapore-postgres.render.com';
const dbUrl = `postgresql://banh_kem_user:BanhKemDb2026!@${host}:5432/banh_kem_db_bhu1`;

const secrets = {
  jwt: crypto.randomBytes(64).toString('hex'),
  jwtRefresh: crypto.randomBytes(64).toString('hex'),
  session: crypto.randomBytes(64).toString('hex'),
};

const servicePayload = {
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
        { key: 'JWT_SECRET', value: secrets.jwt },
        { key: 'JWT_REFRESH_SECRET', value: secrets.jwtRefresh },
        { key: 'SESSION_SECRET', value: secrets.session },
        { key: 'API_BASE_URL', value: 'https://banh-kem.onrender.com' },
        { key: 'FRONTEND_URL', value: 'https://banh-kem.onrender.com' },
        { key: 'FACEBOOK_APP_ID', value: '2235435903938309' },
        { key: 'FACEBOOK_APP_SECRET', value: 'ee049bf32b130a58d267b7e7b79afd19' },
        { key: 'ADMIN_EMAIL', value: 'admin@banhkem.com' },
        { key: 'ADMIN_PASSWORD', value: 'admin123' },
      ],
    },
  },
};

const bodyStr = JSON.stringify(servicePayload, null, 2);
console.log('=== REQUEST BODY ===');
console.log(bodyStr);
console.log('\n=== SENDING REQUEST ===');

const options = {
  hostname: 'api.render.com',
  port: 443,
  path: '/v1/services',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bodyStr),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      console.log('\n=== RESPONSE ===');
      console.log(`Status: ${res.statusCode}`);
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => console.error('Error:', e));
req.write(bodyStr);
req.end();