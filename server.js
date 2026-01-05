import express from "express";
import cors from "cors";
import Database from "better-sqlite3";

const app = express();
app.use(cors());
app.use(express.json());
import path from "path";
import { fileURLToPath } from "url";

// Required because of ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend folder
app.use(express.static(path.join(__dirname, "frontend")));

// Serve index.html for all unknown routes (optional SPA support)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

const db = new Database("dsa_v2.sqlite");
const USERS = ["Akshaya", "Arpan"];

/* ============================================================
   SCHEMA
============================================================ */
db.exec(`
CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT,
  name TEXT NOT NULL,
  link TEXT,
  topic TEXT NOT NULL,
  difficulty TEXT CHECK(difficulty IN ('Easy','Medium','Hard')) NOT NULL,
  UNIQUE(platform, name)
);

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

/* ============================================================
   PROBLEMS
============================================================ */
app.post("/problems", (req, res) => {
  const p = req.body;
  db.prepare(`
    INSERT OR IGNORE INTO problems
    (platform, name, link, topic, difficulty)
    VALUES (?,?,?,?,?)
  `).run(p.platform, p.name, p.link, p.topic, p.difficulty);
  res.json({ success: true });
});

app.get("/problems", (req, res) => {
  const user = req.query.user || null;

  const rows = db.prepare(`
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
    LEFT JOIN attempts a
      ON a.id = (
        SELECT a2.id
        FROM attempts a2
        WHERE a2.problem_id = p.id
          AND (? IS NULL OR a2.user = ?)
        ORDER BY a2.date DESC, a2.id DESC
        LIMIT 1
      )
    ORDER BY
      CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
      p.name
  `).all(user, user);

  res.json(rows);
});

/* ============================================================
   ATTEMPTS
============================================================ */
app.post("/attempts", (req, res) => {
  const a = req.body;

  // Validate required fields
  if (!a.user || !a.problem_id || !a.date || !a.status) {
    return res.status(400).json({
      error: "Missing required fields: user, problem_id, date, status"
    });
  }

  // Validate problem_id exists
  const problemExists = db.prepare("SELECT id FROM problems WHERE id = ?").get(a.problem_id);
  if (!problemExists) {
    return res.status(400).json({
      error: "Problem ID does not exist"
    });
  }

  try {
    const solvedAt = a.status === "Solved" ? a.date : null;

    db.prepare(`
      INSERT INTO attempts
      (user, problem_id, date, status, time_taken, first_try, notes, solved_at)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(
      a.user,
      a.problem_id,
      a.date,
      a.status,
      a.time_taken ?? null,
      a.first_try ? 1 : 0,
      a.notes ?? "",
      solvedAt
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to add attempt: " + error.message
    });
  }
});

app.get("/attempts", (req, res) => {
  const user = req.query.user;
  if (!user) {
    return res.status(400).json({ error: "user query param is required" });
  }

  const rows = db.prepare(`
    SELECT
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
    ORDER BY a.date DESC, a.id DESC
  `).all(user);

  res.json(rows);
});

/* ============================================================
   GOLDEN + STATS
============================================================ */
app.get("/stats/:user", (req, res) => {
  const user = req.params.user;

  const stats = db.prepare(`
    WITH total AS (
      SELECT COUNT(*) AS total_problems FROM problems
    )
    SELECT
      -- Progress
      COUNT(DISTINCT a.problem_id) AS attempted,
      COUNT(DISTINCT CASE WHEN a.status='Solved' THEN a.problem_id END) AS solved,
      ROUND(
        COUNT(DISTINCT CASE WHEN a.status='Solved' THEN a.problem_id END) * 100.0 /
        (SELECT total_problems FROM total), 1
      ) AS completion_percent,

      -- Difficulty solved
      COUNT(DISTINCT CASE WHEN p.difficulty='Easy' AND a.status='Solved' THEN a.problem_id END) AS easy_solved,
      COUNT(DISTINCT CASE WHEN p.difficulty='Medium' AND a.status='Solved' THEN a.problem_id END) AS medium_solved,
      COUNT(DISTINCT CASE WHEN p.difficulty='Hard' AND a.status='Solved' THEN a.problem_id END) AS hard_solved,

      -- Accuracy (check if the very first attempt for each problem was successful)
      ROUND(
        COUNT(CASE 
          WHEN a.status='Solved' AND a.id = (
            SELECT MIN(a2.id) 
            FROM attempts a2 
            WHERE a2.problem_id = a.problem_id AND a2.user = a.user
          ) THEN 1 
        END) * 100.0 /
        NULLIF(COUNT(DISTINCT a.problem_id),0), 2
      ) AS first_try_accuracy,

      -- Early failure
      ROUND(
        COUNT(*) FILTER (WHERE a.first_try=0 AND a.status!='Solved') * 1.0 /
        NULLIF(COUNT(*),0), 2
      ) AS early_failure_rate,

      -- Avg time
      ROUND(AVG(a.time_taken) FILTER (WHERE p.difficulty='Medium' AND a.status='Solved'),1)
        AS avg_medium_time,

      -- Revisits
      COUNT(*) FILTER (WHERE a.status='Revisit') AS pending_revisits,

      -- Re-solve success
      ROUND(
        COUNT(*) FILTER (WHERE a.status='Solved' AND a.notes LIKE '%revisit%') * 1.0 /
        NULLIF(COUNT(*) FILTER (WHERE a.notes LIKE '%revisit%'),0), 2
      ) AS ressolve_success,

      -- Consistency
      COUNT(DISTINCT a.date) AS active_days,
      ROUND(COUNT(DISTINCT a.problem_id) * 1.0 / NULLIF(COUNT(DISTINCT a.date),0),2) AS problems_per_day,

      -- Velocity
      COUNT(DISTINCT CASE 
        WHEN a.status='Solved' AND a.date >= date('now','-7 days') 
        THEN a.problem_id 
      END) AS solved_last_7_days,

      -- Difficulty progression
      ROUND(
        AVG(CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END),
        2
      ) AS difficulty_progression_index

    FROM attempts a
    JOIN problems p ON p.id = a.problem_id
    WHERE a.user = ?
  `).get(user);

  res.json(stats);
});

/* ============================================================
   TOPIC MASTERY & WEAKNESS
============================================================ */
app.get("/stats/:user/topics", (req, res) => {
  const rows = db.prepare(`
    SELECT
      p.topic,
      COUNT(*) AS attempts,
      COUNT(*) FILTER (WHERE a.status='Solved') AS solved,
      ROUND(
        COUNT(*) FILTER (WHERE a.status='Solved') * 1.0 / COUNT(*), 2
      ) AS solve_rate,
      ROUND(
        (COUNT(*) FILTER (WHERE a.status='Solved') * 1.0 / COUNT(*)) *
        AVG(CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END),
        2
      ) AS mastery_score
    FROM attempts a
    JOIN problems p ON p.id = a.problem_id
    WHERE a.user = ?
    GROUP BY p.topic
    HAVING COUNT(*) >= 3
    ORDER BY mastery_score ASC
  `).all(req.params.user);

  res.json(rows);
});

/* ============================================================
   COLD REVISITS
============================================================ */
app.get("/stats/:user/cold-revisits", (req, res) => {
  const rows = db.prepare(`
    SELECT COUNT(*) AS cold_success
    FROM attempts
    WHERE user=?
      AND status='Solved'
      AND julianday(date) - julianday(solved_at) >= 14
  `).get(req.params.user);

  res.json(rows);
});

/* ============================================================
   LEADERBOARD
============================================================ */
app.get("/leaderboard", (req, res) => {
  const rows = db.prepare(`
    SELECT
      a.user,
      COUNT(*) FILTER (WHERE a.status='Solved') AS solved,
      COUNT(*) FILTER (
        WHERE a.status='Solved' AND p.difficulty IN ('Medium','Hard')
      ) AS medium_hard
    FROM attempts a
    JOIN problems p ON p.id = a.problem_id
    GROUP BY a.user
    ORDER BY medium_hard DESC, solved DESC
  `).all();

  res.json(rows);
});

/* ============================================================
   SERVER
============================================================ */
app.listen(3000, () =>
  console.log("DSA Tracker backend running → http://localhost:3000")
);

