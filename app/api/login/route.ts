import { NextRequest } from "next/server";
import client from "../../../lib/db";
import { hashPassword, comparePassword } from "../../../lib/password";
import { initializeDatabase } from "../../../lib/dbInit";
import { generateToken } from "../../../lib/auth";

// Initialize the database when the module loads
let dbInitialized = false;
if (typeof window === "undefined" && !dbInitialized) {
  initializeDatabase()
    .then(() => {
      dbInitialized = true;
    })
    .catch(console.error);
}

export async function POST(req: NextRequest) {
  try {
    const { name, password } = await req.json();

    if (!name || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Find user by name
    const result = await client.execute('SELECT id, name, password FROM users WHERE name = ?', [name]);

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = result.rows[0];

    // Check if password exists and is a string
    if (!user.password || typeof user.password !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Compare password
    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate JWT token
    const token = generateToken({ id: user.id as number, name: user.name as string });

    return new Response(JSON.stringify({
      token,
      user: { id: user.id as number, name: user.name as string }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}