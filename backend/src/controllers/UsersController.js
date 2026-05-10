const AuthService = require('../services/AuthService');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

async function getCurrentProfile(req, res, next) {
  try {
    const user = await AuthService.getUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { display_name, phone, email } = req.body;
    const userId = req.userId;

    const updateData = {};
    if (display_name !== undefined) updateData.display_name = display_name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Không có thông tin để cập nhật' });
    }

    let query = 'UPDATE users SET ';
    const values = [];
    let paramCount = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      query += `${key} = $${paramCount}, `;
      values.push(value);
      paramCount++;
    });

    query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    values.push(userId);

    const result = await pool.query(query, values);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    logger.info(`User profile updated: ${userId}`);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function getUserAddresses(req, res, next) {
  try {
    const userId = req.userId;

    const query = 'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);

    res.json({ addresses: result.rows, count: result.rows.length });
  } catch (error) {
    next(error);
  }
}

async function addAddress(req, res, next) {
  try {
    const userId = req.userId;
    const {
      address_line,
      district,
      province,
      postal_code,
      phone,
      recipient_name,
      is_default = false,
      address_type = 'home',
    } = req.body;

    if (!address_line || !recipient_name) {
      return res.status(400).json({ error: 'Cần có địa chỉ và tên người nhận' });
    }

    const query = `
      INSERT INTO user_addresses (
        id, user_id, address_line, district, province, postal_code, 
        phone, recipient_name, is_default, address_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      uuidv4(),
      userId,
      address_line,
      district,
      province,
      postal_code,
      phone,
      recipient_name,
      is_default,
      address_type,
    ]);

    logger.info(`Address added for user: ${userId}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function updateAddress(req, res, next) {
  try {
    const userId = req.userId;
    const { addressId } = req.params;
    const {
      address_line,
      district,
      province,
      postal_code,
      phone,
      recipient_name,
      is_default,
      address_type,
    } = req.body;

    const updateData = {};
    if (address_line !== undefined) updateData.address_line = address_line;
    if (district !== undefined) updateData.district = district;
    if (province !== undefined) updateData.province = province;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (phone !== undefined) updateData.phone = phone;
    if (recipient_name !== undefined) updateData.recipient_name = recipient_name;
    if (is_default !== undefined) updateData.is_default = is_default;
    if (address_type !== undefined) updateData.address_type = address_type;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Không có thông tin để cập nhật' });
    }

    let query = 'UPDATE user_addresses SET ';
    const values = [];
    let paramCount = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      query += `${key} = $${paramCount}, `;
      values.push(value);
      paramCount++;
    });

    query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;
    values.push(addressId, userId);

    const result = await pool.query(query, values);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Không tìm thấy địa chỉ' });
    }

    logger.info(`Address updated for user: ${userId}`);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const userId = req.userId;
    const { addressId } = req.params;

    const query = 'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [addressId, userId]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Không tìm thấy địa chỉ' });
    }

    logger.info(`Address deleted for user: ${userId}`);
    res.json({ deleted: true, addressId });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrentProfile,
  updateProfile,
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
};
