import { createClient } from "@libsql/client";

// Initialize Turso DB client
const DB_URL = process.env.TURSO_DB_URL || process.env.DB_URL;
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.AUTH_TOKEN;

if (!DB_URL) {
  console.error("TURSO_DB_URL or DB_URL is not set in environment variables");
  process.exit(1);
}

if (!AUTH_TOKEN) {
  console.error("TURSO_AUTH_TOKEN or AUTH_TOKEN is not set in environment variables");
  process.exit(1);
}

const client = createClient({
  url: DB_URL,
  authToken: AUTH_TOKEN
});

export default client;