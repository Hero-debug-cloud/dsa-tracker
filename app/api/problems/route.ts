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

    let query;
    let params: any[] = [];

    if (userFilter) {
      // Get problems with user's latest attempt status
      // Use COALESCE to get topic from topic_id if available, otherwise from the old topic column
      query = `
        SELECT
          p.id,
          p.platform,
          p.name,
          p.link,
          COALESCE(t.name, p.topic) AS topic,
          p.difficulty,
          a.status,
          a.time_taken,
          a.first_try,
          a.date,
          (
            SELECT GROUP_CONCAT(DISTINCT user)
            FROM attempts a2
            WHERE a2.problem_id = p.id
              AND a2.status = 'Solved'
          ) AS solved_by_users
        FROM problems p
        LEFT JOIN topics t ON p.topic_id = t.id
        LEFT JOIN attempts a ON a.id = (
          SELECT a2.id
          FROM attempts a2
          WHERE a2.problem_id = p.id
            AND a2.user = ?
          ORDER BY a2.date DESC, a2.id DESC
          LIMIT 1
        )
        ORDER BY
          CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
          p.name
      `;
      params = [userFilter];
    } else {
      // Get problems without user-specific status
      query = `
        SELECT
          p.id,
          p.platform,
          p.name,
          p.link,
          COALESCE(t.name, p.topic) AS topic,
          p.difficulty,
          NULL AS status,
          NULL AS time_taken,
          NULL AS first_try,
          NULL AS date,
          (
            SELECT GROUP_CONCAT(DISTINCT user)
            FROM attempts a2
            WHERE a2.problem_id = p.id
              AND a2.status = 'Solved'
          ) AS solved_by_users
        FROM problems p
        LEFT JOIN topics t ON p.topic_id = t.id
        ORDER BY
          CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
          p.name
      `;
    }

    const rows = userFilter
      ? await client.execute(query, params)
      : await client.execute(query);

    return new Response(JSON.stringify(rows.rows), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching problems:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch problems" }), {
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
    const p = await req.json();

    // First, ensure the topic exists in the topics table
    let topicResult = await client.execute(
      "SELECT id FROM topics WHERE name = ?",
      [p.topic]
    );

    let topicId;
    if (topicResult.rows.length === 0) {
      // If topic doesn't exist, create it
      const insertResult = await client.execute(
        "INSERT INTO topics (name) VALUES (?)",
        [p.topic]
      );
      topicId = Number(insertResult.lastInsertRowid);
    } else {
      topicId = topicResult.rows[0]["id"] as number;
    }

    // Check for duplicates (platform + name)
    const existingProblem = await client.execute(
      "SELECT id FROM problems WHERE platform = ? AND name = ?",
      [p.platform, p.name]
    );

    if (existingProblem.rows.length === 0) {
      await client.execute(
        "INSERT INTO problems (platform, name, link, topic_id, difficulty) VALUES (?, ?, ?, ?, ?)",
        [p.platform, p.name, p.link, topicId, p.difficulty]
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error adding problem:", error);
    return new Response(JSON.stringify({ error: "Failed to add problem" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}