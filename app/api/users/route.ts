import { NextRequest } from "next/server";
import client from "../../../lib/db";
import jwt from "jsonwebtoken";
import { hashPassword } from "../../../lib/password";
import { initializeDatabase } from "../../../lib/dbInit";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not set in environment variables");
  process.exit(1);
}

// Authentication middleware
const authenticateToken = async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return null;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as { id: number; name: string };
    return user;
  } catch (err) {
    return null;
  }
};

// Initialize the database when the module loads
let dbInitialized = false;
if (typeof window === "undefined" && !dbInitialized) {
  initializeDatabase()
    .then(() => {
      dbInitialized = true;
    })
    .catch(console.error);
}

export async function GET(req: NextRequest) {
  const user = await authenticateToken(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Access token required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const result = await client.execute(`
      SELECT id, name, created_at
      FROM users
      ORDER BY name
    `);

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function POST(req: NextRequest) {
  const user = await authenticateToken(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Access token required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { name } = await req.json();

    if (!name) {
      return new Response(JSON.stringify({ error: "User name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const hashedPassword = await hashPassword("Password123");
    const result = await client.execute("INSERT INTO users (name, password) VALUES (?, ?)", [name, hashedPassword]);
    
    return new Response(JSON.stringify({ 
      id: result.lastInsertRowid, 
      name, 
      created_at: new Date().toISOString() 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint")) {
      return new Response(JSON.stringify({ error: "User already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.error("Error adding user:", error);
    return new Response(JSON.stringify({ error: "Failed to add user: " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}