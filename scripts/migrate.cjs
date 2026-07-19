const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Credentials come from the environment — never hardcode them here.
// Usage: set DB_HOST / DB_PASSWORD (etc.) then run: node scripts/migrate.cjs
const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');

(async () => {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected. Running schema migration...');
    await client.query(sql);
    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
