'use strict';
const { query } = require('../../config/db');

// ─── Column projection ────────────────────────────────────────────────────────
const COLUMNS = `
  s.id,
  s.user_id,
  s.title,
  s.description,
  s.category,
  s.price_type,
  s.price,
  s.location,
  s.city,
  s.state,
  s.experience_years,
  s.is_available,
  s.rating,
  s.total_reviews,
  s.images,
  s.provider_name,
  s.provider_phone,
  s.provider_email,
  s.created_at,
  s.updated_at,
  u.full_name AS owner_name,
  u.email     AS owner_email,
  u.phone     AS owner_phone
`.trim();

// ─── Row mapper ───────────────────────────────────────────────────────────────
const mapRow = (r) => ({
  id:              r.id,
  userId:          r.user_id,
  title:           r.title,
  description:     r.description,
  category:        r.category,
  priceType:       r.price_type,
  price:           r.price,
  location:        r.location,
  city:            r.city,
  state:           r.state,
  experienceYears: r.experience_years,
  isAvailable:     r.is_available,
  rating:          r.rating,
  totalReviews:    r.total_reviews,
  images:          r.images || [],
  providerName:    r.provider_name,
  providerPhone:   r.provider_phone,
  providerEmail:   r.provider_email,
  owner: {
    id:    r.user_id,
    name:  r.owner_name,
    email: r.owner_email,
    phone: r.owner_phone,
  },
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// ─── Helper: HTTP-style errors ────────────────────────────────────────────────
const createError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of home services.
 *
 * Supported filters (all from req.query):
 *   category, city, is_available, search (title + description), page, limit
 */
const getServices = async (filters = {}) => {
  const {
    category,
    city,
    is_available,
    search,
    page  = 1,
    limit = 10,
  } = filters;

  const params = [];
  const where  = ['1=1'];

  const addFilter = (clause, value) => {
    params.push(value);
    where.push(clause.replace('$?', `$${params.length}`));
  };

  if (category) addFilter('s.category = $?', category);
  if (city) addFilter('s.city ILIKE $?', `%${city}%`);

  const availabilityFilter =
    is_available === undefined || is_available === ''
      ? true
      : is_available === true || is_available === 'true';
  addFilter('s.is_available = $?', availabilityFilter);

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const idx = params.length;
    where.push(`(s.title ILIKE $${idx} OR s.description ILIKE $${idx})`);
  }

  const whereClause = where.join(' AND ');

  const countResult = await query(
    `SELECT COUNT(*) FROM home_services s WHERE ${whereClause}`,
    params
  );
  const total = Number(countResult.rows[0].count);

  const safePage  = Math.max(1, Number(page)  || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const offset    = (safePage - 1) * safeLimit;

  const dataResult = await query(
    `SELECT ${COLUMNS}
       FROM home_services s
       JOIN users u ON u.id = s.user_id
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, safeLimit, offset]
  );

  return {
    services: dataResult.rows.map(mapRow),
    total,
    page:       safePage,
    limit:      safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
};

/**
 * Fetch a single home service by ID, joined with owner info.
 * Throws 404 if not found.
 */
const getServiceById = async (id) => {
  const result = await query(
    `SELECT ${COLUMNS}
       FROM home_services s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = $1`,
    [id]
  );
  if (!result.rows.length) throw createError('Home service not found', 404);
  return mapRow(result.rows[0]);
};

/**
 * Insert a new home service record and return the full mapped object.
 */
const createService = async (userId, data) => {
  const {
    title,
    description      = null,
    category,
    price_type       = 'fixed',
    price            = null,
    location,
    city             = null,
    state            = null,
    experience_years = 0,
    is_available     = true,
    images           = [],
    provider_name,
    provider_phone,
    provider_email   = null,
  } = data;

  const result = await query(
    `INSERT INTO home_services (
        user_id, title, description, category,
        price_type, price, location, city, state,
        experience_years, is_available, images,
        provider_name, provider_phone, provider_email
      ) VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,$8,$9,
        $10,$11,$12,
        $13,$14,$15
      ) RETURNING id`,
    [
      userId, title, description, category,
      price_type, price, location, city, state,
      experience_years, is_available, images,
      provider_name, provider_phone, provider_email,
    ]
  );

  return getServiceById(result.rows[0].id);
};

/**
 * Update an existing home service. Only the owner can update.
 * Throws 403 if record belongs to a different user, 404 if not found.
 */
const updateService = async (id, userId, data) => {
  const FIELD_MAP = {
    title:            'title',
    description:      'description',
    category:         'category',
    price_type:       'price_type',
    price:            'price',
    location:         'location',
    city:             'city',
    state:            'state',
    experience_years: 'experience_years',
    is_available:     'is_available',
    images:           'images',
    provider_name:    'provider_name',
    provider_phone:   'provider_phone',
    provider_email:   'provider_email',
  };

  const setClauses = [];
  const values     = [];

  for (const [key, col] of Object.entries(FIELD_MAP)) {
    if (data[key] !== undefined) {
      values.push(data[key]);
      setClauses.push(`${col} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    throw createError('No valid fields provided for update', 400);
  }

  // Verify ownership before updating
  const own = await query('SELECT user_id FROM home_services WHERE id = $1', [id]);
  if (!own.rows.length) throw createError('Home service not found', 404);
  if (own.rows[0].user_id !== userId) throw createError('Forbidden: you do not own this service', 403);

  values.push(id);
  const result = await query(
    `UPDATE home_services SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING id`,
    values
  );

  if (!result.rows.length) throw createError('Home service not found', 404);
  return getServiceById(id);
};

/**
 * Delete a home service by ID. Only the owner can delete.
 * Throws 403 if record belongs to a different user, 404 if not found.
 */
const deleteService = async (id, userId) => {
  const own = await query('SELECT user_id FROM home_services WHERE id = $1', [id]);
  if (!own.rows.length) throw createError('Home service not found', 404);
  if (own.rows[0].user_id !== userId) throw createError('Forbidden: you do not own this service', 403);

  await query('DELETE FROM home_services WHERE id = $1', [id]);
  return { message: 'Home service deleted successfully' };
};

/**
 * Fetch all home services belonging to a specific user (no pagination).
 */
const getMyServices = async (userId) => {
  const result = await query(
    `SELECT ${COLUMNS}
       FROM home_services s
       JOIN users u ON u.id = s.user_id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC`,
    [userId]
  );
  return result.rows.map(mapRow);
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getMyServices,
};
