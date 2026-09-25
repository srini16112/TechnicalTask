'use strict';
const { query } = require('../../config/db');

// ─── Column projection ────────────────────────────────────────────────────────
const COLUMNS = `
  p.id,
  p.user_id,
  p.title,
  p.description,
  p.listing_type,
  p.property_type,
  p.bhk,
  p.price,
  p.price_negotiable,
  p.location,
  p.city,
  p.state,
  p.pincode,
  p.area_sqft,
  p.furnishing,
  p.floor,
  p.total_floors,
  p.parking,
  p.amenities,
  p.available_from,
  p.is_available,
  p.images,
  p.contact_name,
  p.contact_phone,
  p.contact_email,
  p.created_at,
  p.updated_at,
  u.full_name  AS owner_name,
  u.email      AS owner_email,
  u.phone      AS owner_phone
`.trim();

// ─── Row mapper ───────────────────────────────────────────────────────────────
const mapRow = (r) => ({
  id:              r.id,
  userId:          r.user_id,
  title:           r.title,
  description:     r.description,
  listingType:     r.listing_type,
  propertyType:    r.property_type,
  bhk:             r.bhk,
  price:           r.price,
  priceNegotiable: r.price_negotiable,
  location:        r.location,
  city:            r.city,
  state:           r.state,
  pincode:         r.pincode,
  areaSqft:        r.area_sqft,
  furnishing:      r.furnishing,
  floor:           r.floor,
  totalFloors:     r.total_floors,
  parking:         r.parking,
  amenities:       r.amenities || [],
  availableFrom:   r.available_from,
  isAvailable:     r.is_available,
  images:          r.images || [],
  contactName:     r.contact_name,
  contactPhone:    r.contact_phone,
  contactEmail:    r.contact_email,
  owner: {
    id:    r.user_id,
    name:  r.owner_name,
    email: r.owner_email,
    phone: r.owner_phone,
  },
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// ─── Helper: throw HTTP-style errors ─────────────────────────────────────────
const createError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of properties.
 *
 * Supported filters (all from req.query):
 *   listing_type, property_type, bhk, city, min_price, max_price,
 *   is_available, search (searches title + location), page, limit
 */
const getProperties = async (filters = {}) => {
  const {
    listing_type,
    property_type,
    bhk,
    city,
    min_price,
    max_price,
    is_available,
    search,
    page  = 1,
    limit = 10,
  } = filters;

  const params = [];
  const where  = ['1=1'];

  /** Push a value and append the clause with correct $N placeholder */
  const addFilter = (clause, value) => {
    params.push(value);
    where.push(clause.replace('$?', `$${params.length}`));
  };

  if (listing_type) addFilter('p.listing_type = $?', listing_type);
  if (property_type) addFilter('p.property_type = $?', property_type);
  if (bhk !== undefined && bhk !== '') addFilter('p.bhk = $?', Number(bhk));
  if (city) addFilter('p.city ILIKE $?', `%${city}%`);
  if (min_price !== undefined && min_price !== '') addFilter('p.price >= $?', Number(min_price));
  if (max_price !== undefined && max_price !== '') addFilter('p.price <= $?', Number(max_price));

  // Default: show only available properties unless caller explicitly requests all
  const availabilityFilter =
    is_available === undefined || is_available === ''
      ? true
      : is_available === true || is_available === 'true';
  addFilter('p.is_available = $?', availabilityFilter);

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const idx = params.length;
    where.push(`(p.title ILIKE $${idx} OR p.location ILIKE $${idx})`);
  }

  const whereClause = where.join(' AND ');

  // Total count for pagination metadata
  const countResult = await query(
    `SELECT COUNT(*) FROM properties p WHERE ${whereClause}`,
    params
  );
  const total = Number(countResult.rows[0].count);

  const safePage  = Math.max(1, Number(page)  || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const offset    = (safePage - 1) * safeLimit;

  const dataResult = await query(
    `SELECT ${COLUMNS}
       FROM properties p
       JOIN users u ON u.id = p.user_id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, safeLimit, offset]
  );

  return {
    properties: dataResult.rows.map(mapRow),
    total,
    page:       safePage,
    limit:      safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
};

/**
 * Fetch a single property by ID, joined with owner info.
 * Throws 404 if not found.
 */
const getPropertyById = async (id) => {
  const result = await query(
    `SELECT ${COLUMNS}
       FROM properties p
       JOIN users u ON u.id = p.user_id
      WHERE p.id = $1`,
    [id]
  );
  if (!result.rows.length) throw createError('Property not found', 404);
  return mapRow(result.rows[0]);
};

/**
 * Insert a new property record and return the full mapped object.
 */
const createProperty = async (userId, data) => {
  const {
    title,
    description      = null,
    listing_type,
    property_type,
    bhk              = null,
    price,
    price_negotiable = false,
    location,
    city             = null,
    state            = null,
    pincode          = null,
    area_sqft        = null,
    furnishing       = 'unfurnished',
    floor            = null,
    total_floors     = null,
    parking          = false,
    amenities        = [],
    available_from   = null,
    is_available     = true,
    images           = [],
    contact_name     = null,
    contact_phone    = null,
    contact_email    = null,
  } = data;

  const result = await query(
    `INSERT INTO properties (
        user_id, title, description, listing_type, property_type,
        bhk, price, price_negotiable, location, city, state, pincode,
        area_sqft, furnishing, floor, total_floors, parking, amenities,
        available_from, is_available, images,
        contact_name, contact_phone, contact_email
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17,$18,
        $19,$20,$21,
        $22,$23,$24
      ) RETURNING id`,
    [
      userId, title, description, listing_type, property_type,
      bhk, price, price_negotiable, location, city, state, pincode,
      area_sqft, furnishing, floor, total_floors, parking, amenities,
      available_from, is_available, images,
      contact_name, contact_phone, contact_email,
    ]
  );

  return getPropertyById(result.rows[0].id);
};

/**
 * Update an existing property. Only the owner (user_id match) can update.
 * Throws 403 if record belongs to a different user, 404 if not found.
 */
const updateProperty = async (id, userId, data) => {
  // Map camelCase / snake_case incoming keys to DB column names
  const FIELD_MAP = {
    title:            'title',
    description:      'description',
    listing_type:     'listing_type',
    property_type:    'property_type',
    bhk:              'bhk',
    price:            'price',
    price_negotiable: 'price_negotiable',
    location:         'location',
    city:             'city',
    state:            'state',
    pincode:          'pincode',
    area_sqft:        'area_sqft',
    furnishing:       'furnishing',
    floor:            'floor',
    total_floors:     'total_floors',
    parking:          'parking',
    amenities:        'amenities',
    available_from:   'available_from',
    is_available:     'is_available',
    images:           'images',
    contact_name:     'contact_name',
    contact_phone:    'contact_phone',
    contact_email:    'contact_email',
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

  // First verify ownership
  const own = await query('SELECT user_id FROM properties WHERE id = $1', [id]);
  if (!own.rows.length) throw createError('Property not found', 404);
  if (own.rows[0].user_id !== userId) throw createError('Forbidden: you do not own this property', 403);

  values.push(id);
  const result = await query(
    `UPDATE properties SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING id`,
    values
  );

  if (!result.rows.length) throw createError('Property not found', 404);
  return getPropertyById(id);
};

/**
 * Delete a property by ID. Only the owner can delete.
 * Throws 403 if record belongs to a different user, 404 if not found.
 */
const deleteProperty = async (id, userId) => {
  const own = await query('SELECT user_id FROM properties WHERE id = $1', [id]);
  if (!own.rows.length) throw createError('Property not found', 404);
  if (own.rows[0].user_id !== userId) throw createError('Forbidden: you do not own this property', 403);

  await query('DELETE FROM properties WHERE id = $1', [id]);
  return { message: 'Property deleted successfully' };
};

/**
 * Fetch all properties belonging to a specific user (no pagination).
 */
const getMyProperties = async (userId) => {
  const result = await query(
    `SELECT ${COLUMNS}
       FROM properties p
       JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC`,
    [userId]
  );
  return result.rows.map(mapRow);
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
};
