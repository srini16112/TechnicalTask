'use strict';
const { query } = require('../../config/db');

const getProfile = async (userId) => {
  const { rows } = await query(`
    SELECT u.id, u.full_name, u.email, u.phone, u.role, u.avatar_url, u.is_active,
           u.created_at, u.updated_at, p.bio, p.address, p.city, p.state,
           p.postal_code, p.website, p.created_at AS profile_created_at,
           p.updated_at AS profile_updated_at
    FROM users u
    LEFT JOIN user_profiles p ON p.user_id = u.id
    WHERE u.id = $1`, [userId]);
  if (!rows.length) { const err = new Error('User not found'); err.status = 404; throw err; }
  const row = rows[0];
  return {
    id: row.id, fullName: row.full_name, email: row.email, phone: row.phone,
    role: row.role, avatarUrl: row.avatar_url, isActive: row.is_active,
    createdAt: row.created_at, updatedAt: row.updated_at,
    profile: { bio: row.bio, address: row.address, city: row.city, state: row.state,
      postalCode: row.postal_code, website: row.website,
      createdAt: row.profile_created_at, updatedAt: row.profile_updated_at },
  };
};

const updateProfile = async (userId, data) => {
  const userFields = { fullName: 'full_name', phone: 'phone', avatarUrl: 'avatar_url' };
  const profileFields = { bio: 'bio', address: 'address', city: 'city', state: 'state', postalCode: 'postal_code', website: 'website' };
  const userSet = [], userParams = [], profileSet = [], profileParams = [];
  Object.entries(data).forEach(([key, value]) => {
    if (userFields[key]) { userParams.push(value); userSet.push(`${userFields[key]} = $${userParams.length}`); }
    if (profileFields[key]) { profileParams.push(value); profileSet.push(`${profileFields[key]} = $${profileParams.length + 1}`); }
  });
  if (userSet.length) await query(`UPDATE users SET ${userSet.join(', ')} WHERE id = $${userParams.length + 1}`, [...userParams, userId]);
  if (profileSet.length) {
    const values = profileParams.map((value) => value);
    const columns = profileSet.map((part) => part.split(' = ')[0]);
    await query(`INSERT INTO user_profiles (user_id, ${columns.join(', ')}) VALUES ($1, ${columns.map((_, i) => `$${i + 2}`).join(', ')})
      ON CONFLICT (user_id) DO UPDATE SET ${profileSet.map((part, i) => `${columns[i]} = EXCLUDED.${columns[i]}`).join(', ')}`, [userId, ...values]);
  }
  return getProfile(userId);
};

module.exports = { getProfile, updateProfile };
