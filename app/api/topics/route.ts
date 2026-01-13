import { NextRequest } from "next/server";
import client from "../../../lib/db";
import jwt from "jsonwebtoken";
import { initializeDatabase } from "../../../lib/dbInit";

// Initialize the database when the module loads
let dbInitialized = false;
if (typeof window === "undefined" && !dbInitialized) {
  initializeDatabase()
    .then(() => {
      dbInitialized = true;
    })
    .catch(console.error);
}

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

export async function GET(req: NextRequest) {
  const user = await authenticateToken(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Access token required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Fetch all topics from the topics table
    const result = await client.execute("SELECT id, name FROM topics ORDER BY name ASC");
    
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch topics" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}