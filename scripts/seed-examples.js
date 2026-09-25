'use strict';
const { Client } = require('pg');
const env = require('../src/config/env');

const properties = [
  ['Modern 2 BHK Apartment', 'Spacious apartment near metro and tech parks', 'rent', 'apartment', 2, 32000, 'Whitefield', 'Bengaluru', 'Karnataka', '560066'],
  ['Luxury 3 BHK Villa', 'Independent villa with garden and parking', 'buy', 'villa', 3, 18500000, 'Sarjapur Road', 'Bengaluru', 'Karnataka', '560035'],
  ['Affordable PG Room', 'Fully furnished PG with meals and Wi-Fi', 'rent', 'pg', 1, 12000, 'Koramangala', 'Bengaluru', 'Karnataka', '560034'],
  ['Family 1 BHK Home', 'Ready-to-move home in a quiet neighborhood', 'rent', 'full_home', 1, 18000, 'Andheri West', 'Mumbai', 'Maharashtra', '400053'],
  ['Student Hostel Bed', 'Safe hostel close to universities and public transport', 'rent', 'hostel', 1, 8500, 'Hinjewadi', 'Pune', 'Maharashtra', '411057'],
];

const services = [
  ['BrightSpark Electricals', 'electrical', 'Electrical wiring, fan installation, and repairs', 'Ravi Kumar', '9876543211', 'Bengaluru', 'Bengaluru', 'Karnataka', 'fixed', 800],
  ['Trusted Plumbing Care', 'plumbing', 'Leak repair, pipe fitting, and bathroom maintenance', 'Suresh Plumbing', '9876543212', 'Bengaluru', 'Bengaluru', 'Karnataka', 'hourly', 500],
  ['ColorCraft Painting', 'painting', 'Interior and exterior painting for homes and offices', 'Anita Decor', '9876543213', 'Mumbai', 'Mumbai', 'Maharashtra', 'fixed', 12000],
  ['CleanNest Home Cleaning', 'cleaning', 'Deep cleaning, kitchen cleaning, and move-in cleaning', 'Meena Services', '9876543214', 'Pune', 'Pune', 'Maharashtra', 'fixed', 1500],
  ['GreenLeaf Carpentry', 'carpentry', 'Custom furniture, modular repairs, and installation', 'Arjun Woodworks', '9876543215', 'Hyderabad', 'Hyderabad', 'Telangana', 'hourly', 650],
];

const seed = async () => {
  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
  });
  await client.connect();
  try {
    const { rows } = await client.query('SELECT id FROM users WHERE email = $1', ['admin@nobroker.com']);
    if (!rows.length) throw new Error('Seed admin user does not exist');
    const userId = rows[0].id;
    let propertyCount = 0;
    let serviceCount = 0;

    for (const property of properties) {
      const exists = await client.query('SELECT 1 FROM properties WHERE title = $1', [property[0]]);
      if (exists.rowCount) continue;
      await client.query(`
        INSERT INTO properties (
          user_id, title, description, listing_type, property_type, bhk, price,
          location, city, state, pincode, contact_name, contact_phone, is_available
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [userId, ...property, 'NoBroker Admin', '9876543210', true]);
      propertyCount += 1;
    }

    for (const service of services) {
      const exists = await client.query('SELECT 1 FROM home_services WHERE title = $1', [service[0]]);
      if (exists.rowCount) continue;
      await client.query(`
        INSERT INTO home_services (
          user_id, title, category, description, provider_name, provider_phone,
          location, city, state, price_type, price, is_available
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [userId, service[0], service[1], service[2], service[3], service[4], service[5], service[6], service[7], service[8], service[9], true]);
      serviceCount += 1;
    }

    console.log(`Created properties: ${propertyCount}`);
    console.log(`Created home services: ${serviceCount}`);
  } finally {
    await client.end();
  }
};

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
