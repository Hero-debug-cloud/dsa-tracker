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
    const result = await client.execute(`
      SELECT
        a.user,
        COUNT(CASE WHEN a.status='Solved' THEN 1 END) AS solved,
        COUNT(CASE
          WHEN a.status='Solved' AND p.difficulty IN ('Medium','Hard')
          THEN 1
        END) AS medium_hard,
        COUNT(CASE
          WHEN a.status='Solved' AND p.difficulty = 'Easy'
          THEN 1
        END) AS easy_solved,
        COUNT(CASE
          WHEN a.status='Solved' AND p.difficulty = 'Medium'
          THEN 1
        END) AS medium_solved,
        COUNT(CASE
          WHEN a.status='Solved' AND p.difficulty = 'Hard'
          THEN 1
        END) AS hard_solved
      FROM attempts a
      JOIN problems p ON p.id = a.problem_id
      GROUP BY a.user
      ORDER BY medium_hard DESC, solved DESC
    `);

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch leaderboard" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}