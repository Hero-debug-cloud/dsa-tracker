import express from "express";
import cors from "cors";
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(cors());
app.use(express.json());

// Required because of ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend folder
app.use(express.static(path.join(__dirname, "frontend")));

// Serve index.html for all unknown routes (optional SPA support)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Initialize Turso DB client
// For production, set TURSO_DB_URL/TURSO_AUTH_TOKEN or DB_URL/AUTH_TOKEN environment variables
const client = createClient({
  url: process.env.TURSO_DB_URL || process.env.DB_URL || "libsql://bosh-arpan21.aws-ap-south-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njc1OTg0NDgsImlkIjoiOTM1NzQwZWYtN2U0Mi00YjUwLThiYjUtZDNjNjVkMzhiM2E0IiwicmlkIjoiZDAwZTY5MzItNzViOC00NmM2LWJjMTEtNTU0NTI1OTA5YzRjIn0.7mcMY1Dh_giSiSg7pLh7obmEKbnoPTXB_vQI5kCLjS6T1e5M2mbak__a6qNTLt5WjV98hqGWdGfS3GyTuSdxAg"
});

// Initialize database schema
try {
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

  console.log("Database schema initialized successfully");
} catch (error) {
  console.error("Error initializing database schema:", error);
}

/* ============================================================
   PROBLEMS
============================================================ */
app.post("/problems", async (req, res) => {
  const p = req.body;
  
  try {
    // Check for duplicates (platform + name)
    const existingProblem = await client.execute(
      "SELECT id FROM problems WHERE platform = ? AND name = ?",
      [p.platform, p.name]
    );

    if (existingProblem.rows.length === 0) {
      await client.execute(
        "INSERT INTO problems (platform, name, link, topic, difficulty) VALUES (?, ?, ?, ?, ?)",
        [p.platform, p.name, p.link, p.topic, p.difficulty]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding problem:", error);
    res.status(500).json({ error: "Failed to add problem" });
  }
});

app.get("/problems", async (req, res) => {
  const user = req.query.user || null;

  try {
    let query;
    let params = [];
    
    if (user) {
      // Get problems with user's latest attempt status
      query = `
        SELECT 
          p.*,
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
      params = [user];
    } else {
      // Get problems without user-specific status
      query = `
        SELECT 
          p.*,
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
        ORDER BY
          CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
          p.name
      `;
    }

    const rows = user 
      ? await client.execute(query, params)
      : await client.execute(query);

    res.json(rows.rows);
  } catch (error) {
    console.error("Error fetching problems:", error);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

/* ============================================================
   ATTEMPTS
============================================================ */
app.post("/attempts", async (req, res) => {
  const a = req.body;

  // Validate required fields
  if (!a.user || !a.problem_id || !a.date || !a.status) {
    return res.status(400).json({
      error: "Missing required fields: user, problem_id, date, status"
    });
  }

  try {
    // Validate problem_id exists
    const problemResult = await client.execute(
      "SELECT id FROM problems WHERE id = ?",
      [a.problem_id]
    );
    
    if (problemResult.rows.length === 0) {
      return res.status(400).json({
        error: "Problem ID does not exist"
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

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding attempt:", error);
    res.status(500).json({
      error: "Failed to add attempt: " + error.message
    });
  }
});

app.get("/attempts", async (req, res) => {
  const user = req.query.user;
  if (!user) {
    return res.status(400).json({ error: "user query param is required" });
  }

  try {
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
      [user]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching attempts:", error);
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
});

/* ============================================================
   STATS
============================================================ */
app.get("/stats/:user", async (req, res) => {
  const user = req.params.user;

  try {
    const statsResult = await client.execute(`
      WITH total AS (
        SELECT COUNT(*) AS total_problems FROM problems
      )
      SELECT
        -- Progress
        COUNT(DISTINCT a.problem_id) AS attempted,
        COUNT(DISTINCT CASE WHEN a.status='Solved' THEN a.problem_id END) AS solved,
        ROUND(
          CASE 
            WHEN (SELECT total_problems FROM total) > 0 
            THEN COUNT(DISTINCT CASE WHEN a.status='Solved' THEN a.problem_id END) * 100.0 / (SELECT total_problems FROM total)
            ELSE 0
          END, 1
        ) AS completion_percent,

        -- Difficulty solved
        COUNT(DISTINCT CASE WHEN p.difficulty='Easy' AND a.status='Solved' THEN a.problem_id END) AS easy_solved,
        COUNT(DISTINCT CASE WHEN p.difficulty='Medium' AND a.status='Solved' THEN a.problem_id END) AS medium_solved,
        COUNT(DISTINCT CASE WHEN p.difficulty='Hard' AND a.status='Solved' THEN a.problem_id END) AS hard_solved,

        -- First try accuracy (for problems where the first attempt was successful)
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT a.problem_id) > 0
            THEN (
              SELECT COUNT(*) * 100.0 / COUNT(DISTINCT main_a.problem_id)
              FROM (
                SELECT a1.problem_id, MIN(a1.id) as first_attempt_id
                FROM attempts a1
                WHERE a1.user = ?
                GROUP BY a1.problem_id
              ) first_attempts
              JOIN attempts a2 ON a2.id = first_attempts.first_attempt_id
              WHERE a2.status = 'Solved'
            )
            ELSE 0
          END, 2
        ) AS first_try_accuracy,

        -- Early failure rate
        ROUND(
          CASE 
            WHEN COUNT(*) > 0
            THEN COUNT(CASE WHEN a.first_try=0 AND a.status!='Solved' THEN 1 END) * 100.0 / COUNT(*)
            ELSE 0
          END, 2
        ) AS early_failure_rate,

        -- Avg time for medium difficulty
        CASE 
          WHEN COUNT(CASE WHEN p.difficulty='Medium' AND a.status='Solved' THEN 1 END) > 0
          THEN ROUND(AVG(CASE WHEN p.difficulty='Medium' AND a.status='Solved' THEN a.time_taken END), 1)
          ELSE NULL
        END AS avg_medium_time,

        -- Pending revisits
        COUNT(CASE WHEN a.status='Revisit' THEN 1 END) AS pending_revisits,

        -- Re-solve success rate
        CASE 
          WHEN COUNT(CASE WHEN a.notes LIKE '%revisit%' THEN 1 END) > 0
          THEN ROUND(
            COUNT(CASE WHEN a.status='Solved' AND a.notes LIKE '%revisit%' THEN 1 END) * 100.0 / 
            COUNT(CASE WHEN a.notes LIKE '%revisit%' THEN 1 END), 2
          )
          ELSE NULL
        END AS ressolve_success,

        -- Consistency metrics
        COUNT(DISTINCT a.date) AS active_days,
        CASE 
          WHEN COUNT(DISTINCT a.date) > 0
          THEN ROUND(COUNT(DISTINCT a.problem_id) * 1.0 / COUNT(DISTINCT a.date), 2)
          ELSE 0
        END AS problems_per_day,

        -- Velocity: solved in last 7 days
        COUNT(DISTINCT CASE
          WHEN a.status='Solved' AND a.date >= date('now', '-7 days')
          THEN a.problem_id
        END) AS solved_last_7_days,

        -- Difficulty progression
        CASE 
          WHEN COUNT(*) > 0
          THEN ROUND(
            AVG(CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END), 2
          )
          ELSE 0
        END AS difficulty_progression_index

      FROM attempts a
      JOIN problems p ON p.id = a.problem_id
      WHERE a.user = ?
    `, [user, user]);

    const stats = statsResult.rows.length > 0 ? statsResult.rows[0] : {
      attempted: 0,
      solved: 0,
      completion_percent: 0,
      easy_solved: 0,
      medium_solved: 0,
      hard_solved: 0,
      first_try_accuracy: 0,
      early_failure_rate: 0,
      avg_medium_time: null,
      pending_revisits: 0,
      ressolve_success: null,
      active_days: 0,
      problems_per_day: 0,
      solved_last_7_days: 0,
      difficulty_progression_index: 0
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/* ============================================================
   TOPIC MASTERY & WEAKNESS
============================================================ */
app.get("/stats/:user/topics", async (req, res) => {
  const user = req.params.user;

  try {
    const result = await client.execute(`
      SELECT
        p.topic,
        COUNT(*) AS attempts,
        COUNT(CASE WHEN a.status='Solved' THEN 1 END) AS solved,
        CASE 
          WHEN COUNT(*) > 0
          THEN ROUND(COUNT(CASE WHEN a.status='Solved' THEN 1 END) * 1.0 / COUNT(*), 2)
          ELSE 0
        END AS solve_rate,
        CASE 
          WHEN COUNT(*) > 0
          THEN ROUND(
            (COUNT(CASE WHEN a.status='Solved' THEN 1 END) * 1.0 / COUNT(*)) *
            AVG(CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END),
            2
          )
          ELSE 0
        END AS mastery_score
      FROM attempts a
      JOIN problems p ON p.id = a.problem_id
      WHERE a.user = ?
      GROUP BY p.topic
      HAVING COUNT(*) >= 3
      ORDER BY mastery_score ASC
    `, [user]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching topic stats:", error);
    res.status(500).json({ error: "Failed to fetch topic stats" });
  }
});

/* ============================================================
   COLD REVISITS
============================================================ */
app.get("/stats/:user/cold-revisits", async (req, res) => {
  const user = req.params.user;

  try {
    const result = await client.execute(`
      SELECT COUNT(*) AS cold_success
      FROM attempts
      WHERE user=?
        AND status='Solved'
        AND (
          julianday(date) - julianday(solved_at)
        ) >= 14
    `, [user]);

    const coldSuccess = result.rows.length > 0 ? result.rows[0].cold_success : 0;
    res.json({ cold_success: coldSuccess });
  } catch (error) {
    console.error("Error fetching cold revisits:", error);
    res.status(500).json({ error: "Failed to fetch cold revisits" });
  }
});

/* ============================================================
   LEADERBOARD
============================================================ */
app.get("/leaderboard", async (req, res) => {
  try {
    const result = await client.execute(`
      SELECT
        a.user,
        COUNT(CASE WHEN a.status='Solved' THEN 1 END) AS solved,
        COUNT(CASE 
          WHEN a.status='Solved' AND p.difficulty IN ('Medium','Hard') 
          THEN 1 
        END) AS medium_hard
      FROM attempts a
      JOIN problems p ON p.id = a.problem_id
      GROUP BY a.user
      ORDER BY medium_hard DESC, solved DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

/* ============================================================
   SERVER
============================================================ */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`DSA Tracker (Turso) backend running → http://localhost:${PORT}`)
);