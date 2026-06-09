/**
 * Ensure the throwaway e2e database exists before the e2e suite runs.
 *
 * The e2e suite boots the real AppModule with NODE_ENV=test, which sets
 * TypeORM `dropSchema: true`. To keep it from ever wiping the dev/prod database,
 * `test:e2e` runs against a dedicated `e2e_test` database (DB_DATABASE override).
 * This script connects to the configured maintenance database and creates
 * `e2e_test` if it is missing. Idempotent and safe to run repeatedly.
 */
import 'dotenv/config';
import pg from 'pg';

const E2E_DB = 'e2e_test';

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  // Connect to the dev/maintenance DB to issue CREATE DATABASE; never e2e_test.
  database: process.env.DB_DATABASE,
});

await client.connect();
const { rowCount } = await client.query(
  'select 1 from pg_database where datname = $1',
  [E2E_DB],
);
if (rowCount === 0) {
  await client.query(`CREATE DATABASE ${E2E_DB}`);
  console.log(`[e2e] created database ${E2E_DB}`);
} else {
  console.log(`[e2e] database ${E2E_DB} already exists`);
}
await client.end();
