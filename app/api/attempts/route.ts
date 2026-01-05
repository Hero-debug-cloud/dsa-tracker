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
    const { searchParams } = new URL(req.url);
    const userFilter = searchParams.get("user");
    if (!userFilter) {
      return new Response(JSON.stringify({ error: "user query param is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = await client.execute(
      `SELECT
         a.id,
         a.user,
         a.problem_id,
         a.date,
         a.status,
         a.time_taken,
         a.first_try,
         a.notes,
         p.name AS problem_name,
         p.topic,
         p.difficulty
       FROM attempts a
       JOIN problems p ON p.id = a.problem_id
       WHERE a.user = ?
       ORDER BY a.date DESC, a.id DESC`,
      [userFilter]
    );

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching attempts:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch attempts" }), {
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
    const a = await req.json();

    // Validate required fields
    if (!a.user || !a.problem_id || !a.date || !a.status) {
      return new Response(JSON.stringify({
        error: "Missing required fields: user, problem_id, date, status"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate problem_id exists
    const problemResult = await client.execute(
      "SELECT id FROM problems WHERE id = ?",
      [a.problem_id]
    );

    if (problemResult.rows.length === 0) {
      return new Response(JSON.stringify({
        error: "Problem ID does not exist"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const solvedAt = a.status === "Solved" ? a.date : null;

    await client.execute(
      `INSERT INTO attempts
       (user, problem_id, date, status, time_taken, first_try, notes, solved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.user,
        a.problem_id,
        a.date,
        a.status,
        a.time_taken || null,
        a.first_try ? 1 : 0,
        a.notes || "",
        solvedAt
      ]
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error adding attempt:", error);
    return new Response(JSON.stringify({
      error: "Failed to add attempt: " + (error as Error).message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}