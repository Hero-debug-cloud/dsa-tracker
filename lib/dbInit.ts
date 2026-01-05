import { createClient } from "@libsql/client";
import { hashPassword } from "./password";

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

// Initialize database schema
export const initializeDatabase = async () => {
  try {
    // Create tables if they don't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT,
        name TEXT NOT NULL,
        link TEXT,
        topic TEXT NOT NULL,
        difficulty TEXT CHECK(difficulty IN ('Easy','Medium','Hard')) NOT NULL,
        UNIQUE(platform, name)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT NOT NULL,
        problem_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('Solved','Revisit','Unsolved')) NOT NULL,
        time_taken INTEGER,
        first_try INTEGER CHECK(first_try IN (0,1)),
        notes TEXT,
        solved_at TEXT
      );
    `);

    // Create users table with password field
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if the password column exists, if not, add it
    try {
      await client.execute("SELECT password FROM users LIMIT 1");
    } catch (e: any) {
      // If password column doesn't exist, add it
      if (e.message.includes("no such column")) {
        await client.execute("ALTER TABLE users ADD COLUMN password TEXT DEFAULT NULL");
      }
    }

    // Insert default users with hashed passwords if they don't exist
    const defaultUsers = ["Akshaya", "Arpan", "Vinay", "Pradyum", "Lavanya"];
    const defaultPassword = await hashPassword("Password123");

    for (const user of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await client.execute("SELECT id FROM users WHERE name = ?", [user]);
        if (existingUser.rows.length === 0) {
          // Insert new user with password
          await client.execute("INSERT INTO users (name, password) VALUES (?, ?)", [user, defaultPassword]);
        } else {
          // Update existing user to have password if it's NULL
          await client.execute("UPDATE users SET password = ? WHERE name = ? AND password IS NULL", [defaultPassword, user]);
        }
      } catch (e: any) {
        // Ignore duplicate errors
        if (!e.message.includes("UNIQUE constraint")) {
          throw e;
        }
      }
    }

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing database schema:", error);
    throw error;
  }
};

export default client;