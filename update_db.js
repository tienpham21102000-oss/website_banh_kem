const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function getDatabaseUrl() {
    try {
        const envPath = path.join(__dirname, 'backend', '.env');
        if (!fs.existsSync(envPath)) return null;
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=(.+)/);
        return match ? match[1].trim() : null;
    } catch (e) {
        return null;
    }
}

async function runMigration() {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
        console.error('❌ Không tìm thấy DATABASE_URL');
        return;
    }

    console.log('--- Đang thử kết nối tới Render... ---');
    
    // Sử dụng Client thay vì Pool để kết nối trực tiếp
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000, // Tăng thời gian chờ lên 10s
    });

    try {
        await client.connect();
        console.log('✅ Đã kết nối thành công!');
        
        console.log('Đang thực thi lệnh SQL...');
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT \'{}\';');
        
        console.log('✅ THÀNH CÔNG: Đã thêm cột meta vào bảng users.');
    } catch (err) {
        console.error('❌ LỖI:', err.message);
        console.log('\n💡 GỢI Ý: Nếu vẫn lỗi, bạn hãy truy cập Dashboard Render -> Cơ sở dữ liệu -> PSQL Console và dán lệnh sau:');
        console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT \'{}\';');
    } finally {
        await client.end();
        console.log('--- Đã kết thúc. ---');
    }
}

runMigration();
