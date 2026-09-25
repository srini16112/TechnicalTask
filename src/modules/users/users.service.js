'use strict';
const { query } = require('../../config/db');

const safeUser = (row) => ({
  id:        row.id,
  fullName:  row.full_name,
  email:     row.email,
  phone:     row.phone,
  role:      row.role,
  avatarUrl: row.avatar_url,
  isActive:  row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ─── Get All Users (paginated + search) ─────────────────────────────────────
const getAllUsers = async ({ page = 1, limit = 10, search = '', role = '' } = {}) => {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = 'WHERE 1=1';

  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }
  if (role) {
    params.push(role);
    whereClause += ` AND role = $${params.length}`;
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT id, full_name, email, phone, role, avatar_url, is_active, created_at, updated_at
     FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    users:      rows.map(safeUser),
    total,
    page:       Number(page),
    limit:      Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

// ─── Get User by ID ──────────────────────────────────────────────────────────
const getUserById = async (id) => {
  const { rows } = await query(
    `SELECT id, full_name, email, phone, role, avatar_url, is_active, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  return safeUser(rows[0]);
};

// ─── Update User ─────────────────────────────────────────────────────────────
const updateUser = async (id, { fullName, phone, avatarUrl, role, isActive }) => {
  const setClauses = [];
  const params = [];

  if (fullName  !== undefined) { params.push(fullName);  setClauses.push(`full_name = $${params.length}`); }
  if (phone     !== undefined) { params.push(phone);     setClauses.push(`phone = $${params.length}`); }
  if (avatarUrl !== undefined) { params.push(avatarUrl); setClauses.push(`avatar_url = $${params.length}`); }
  if (role      !== undefined) { params.push(role);      setClauses.push(`role = $${params.length}`); }
  if (isActive  !== undefined) { params.push(isActive);  setClauses.push(`is_active = $${params.length}`); }

  if (setClauses.length === 0) {
    const err = new Error('No fields to update'); err.status = 400; throw err;
  }

  params.push(id);
  const { rows } = await query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${params.length}
     RETURNING id, full_name, email, phone, role, avatar_url, is_active, created_at, updated_at`,
    params
  );

  if (rows.length === 0) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  return safeUser(rows[0]);
};

// ─── Delete User (soft delete) ───────────────────────────────────────────────
const deleteUser = async (id) => {
  const { rowCount } = await query(
    `UPDATE users SET is_active = FALSE WHERE id = $1`,
    [id]
  );
  if (rowCount === 0) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  // Also revoke all refresh tokens for this user
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);
  await query('DELETE FROM tokens WHERE user_id = $1', [id]);
  return { message: 'User deactivated successfully' };
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
const getUserStats = async () => {
  const { rows } = await query(`
    SELECT
      COUNT(*)                                               AS total_users,
      COUNT(*) FILTER (WHERE is_active = TRUE)              AS active_users,
      COUNT(*) FILTER (WHERE role = 'admin')                AS admin_count,
      COUNT(*) FILTER (
        WHERE created_at >= date_trunc('month', NOW())
      )                                                      AS new_this_month
    FROM users
  `);
  const r = rows[0];
  return {
    totalUsers:   parseInt(r.total_users, 10),
    activeUsers:  parseInt(r.active_users, 10),
    adminCount:   parseInt(r.admin_count, 10),
    newThisMonth: parseInt(r.new_this_month, 10),
  };
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getUserStats };
