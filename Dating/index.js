const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối Database (Lấy chuỗi này từ Supabase > Settings > Database)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- API ĐĂNG NHẬP SỐ ĐIỆN THOẠI ---
app.post('/api/login', async (req, res) => {
  const { phone } = req.body;
  try {
    // Nếu chưa có SĐT thì thêm mới, có rồi thì cập nhật thời gian hoạt động
    const result = await pool.query(
      `INSERT INTO users (phone_number, last_active) 
       VALUES ($1, NOW()) 
       ON CONFLICT (phone_number) 
       DO UPDATE SET last_active = NOW() 
       RETURNING *`, [phone]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API LẤY THỐNG KÊ CHO DASHBOARD ---
app.get('/api/admin-stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as new_today,
        (SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE) as msgs_today
    `);
    
    // Lấy dữ liệu 7 ngày gần nhất để vẽ biểu đồ
    const chart = await pool.query(`
      SELECT TO_CHAR(created_at, 'DD/MM') as date, COUNT(*) as count 
      FROM users 
      GROUP BY date ORDER BY date DESC LIMIT 7
    `);

    res.json({ summary: stats.rows[0], chart: chart.rows.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));