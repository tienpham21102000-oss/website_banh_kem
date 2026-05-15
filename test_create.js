const https = require('https');
const API_KEY = 'rnd_4ZCy8BGVm0FL3Yyrg26bht5GKIKa';

function call(method, path, body) {
  return new Promise((resolve, reject) => {
    const s = JSON.stringify(body);
    const opts = {
      hostname: 'api.render.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(s),
      },
    };
    const r = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve(d); }
      });
    });
    r.on('error', reject);
    r.write(s);
    r.end();
  });
}

async function main() {
  // Try 1: buildCommand at root of serviceDetails
  console.log('=== TRY 1: buildCommand in serviceDetails root ===');
  let r = await call('POST', '/v1/services', {
    type: 'web_service',
    name: 'test-bk-1',
    ownerId: 'tea-d7uaacd0lvsc73esbhtg',
    repo: 'https://github.com/tienpham21102000-oss/website_banh_kem',
    branch: 'main',
    serviceDetails: {
      buildCommand: 'echo hello',
      startCommand: 'node -e "console.log(1)"',
      runtime: 'node',
      plan: 'free',
      region: 'singapore',
      envSpecificDetails: {
        buildEnvVars: [],
        startEnvVars: [{ key: 'TEST', value: '1' }],
      },
    },
  });
  console.log('Result:', JSON.stringify(r));
  
  if (r.message && r.message.includes('buildCommand')) {
    // Try 2: buildCommand at root of payload
    console.log('\n=== TRY 2: buildCommand at root of payload ===');
    r = await call('POST', '/v1/services', {
      type: 'web_service',
      name: 'test-bk-2',
      ownerId: 'tea-d7uaacd0lvsc73esbhtg',
      repo: 'https://github.com/tienpham21102000-oss/website_banh_kem',
      branch: 'main',
      buildCommand: 'echo hello',
      startCommand: 'node -e "console.log(1)"',
      serviceDetails: {
        runtime: 'node',
        plan: 'free',
        region: 'singapore',
        envSpecificDetails: {
          buildEnvVars: [],
          startEnvVars: [{ key: 'TEST', value: '1' }],
        },
      },
    });
    console.log('Result:', JSON.stringify(r));
  }
  
  if (r.message && r.message.includes('buildCommand')) {
    // Try 3: Try the v1/services endpoint differently
    console.log('\n=== TRY 3: Using /services (no v1) ===');
    r = await call('POST', '/services', {
      type: 'web_service',
      name: 'test-bk-3',
    });
    console.log('Result:', JSON.stringify(r));
  }
}

main().catch(console.error);