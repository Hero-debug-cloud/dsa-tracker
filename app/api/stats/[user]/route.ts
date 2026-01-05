
import { NextRequest, NextResponse } from "next/server";
import client from "../../../../lib/db";
import jwt from "jsonwebtoken";
import { initializeDatabase } from "../../../../lib/dbInit";

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

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ user: string }> }
) {
    const params = await props.params;
    const userParam = decodeURIComponent(params.user);

    const user = await authenticateToken(req);
    if (!user) {
        return new NextResponse(JSON.stringify({ error: "Access token required" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        const statsResult = await client.execute(`
      WITH total AS (
        SELECT COUNT(*) AS total_problems FROM problems
      ),
      first_try_data AS (
        SELECT 
          COUNT(*) as fts_numerator
        FROM (
          SELECT a1.problem_id, MIN(a1.id) as first_attempt_id
          FROM attempts a1
          WHERE a1.user = ?
          GROUP BY a1.problem_id
        ) first_attempts
        JOIN attempts a2 ON a2.id = first_attempts.first_attempt_id
        WHERE a2.status = 'Solved'
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

        -- First try accuracy
        ROUND(
          CASE
            WHEN COUNT(DISTINCT a.problem_id) > 0
            THEN (SELECT fts_numerator FROM first_try_data) * 100.0 / COUNT(DISTINCT a.problem_id)
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
    `, [userParam, userParam]);

        // Fetch daily activity for the chart (last 30 days)
        const activityResult = await client.execute(`
      SELECT 
        date,
        COUNT(DISTINCT problem_id) as count
      FROM attempts
      WHERE user = ? 
        AND status = 'Solved' 
        AND date >= date('now', '-30 days')
      GROUP BY date
      ORDER BY date ASC
    `, [userParam]);

        // Fetch calendar activity data (current month)
        const calendarResult = await client.execute(`
      SELECT 
        date,
        COUNT(DISTINCT problem_id) as count
      FROM attempts
      WHERE user = ? 
        AND status = 'Solved' 
        AND date >= date('now', 'start of month')
        AND date <= date('now', 'start of month', '+1 month', '-1 day')
      GROUP BY date
      ORDER BY date ASC
    `, [userParam]);

        // Calculate streaks - basic approach
        const streakResult = await client.execute(`
      SELECT 
        COUNT(DISTINCT date) as total_active_days,
        -- For now, use a simple calculation - can be enhanced later
        CASE 
          WHEN MAX(date) = date('now') THEN 1
          WHEN MAX(date) = date('now', '-1 day') THEN 1  
          ELSE 0
        END as current_streak,
        COUNT(DISTINCT date) as best_streak
      FROM attempts
      WHERE user = ? AND status = 'Solved'
    `, [userParam]);

        const activity_log = activityResult.rows.map(row => ({
            date: String(row.date),
            count: Number(row.count)
        }));

        const calendar_activity = calendarResult.rows.reduce((acc, row) => {
            acc[String(row.date)] = Number(row.count);
            return acc;
        }, {} as { [key: string]: number });

        const streakData = streakResult.rows.length > 0 ? streakResult.rows[0] : { current_streak: 0, best_streak: 0 };

        const statsRow = statsResult.rows.length > 0 ? statsResult.rows[0] : null;

        const stats = statsRow ? {
            ...statsRow,
            activity_log,
            calendar_activity,
            current_streak: Number(streakData.current_streak),
            best_streak: Number(streakData.best_streak)
        } : {
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
            difficulty_progression_index: 0,
            activity_log: [],
            calendar_activity: {},
            current_streak: 0,
            best_streak: 0
        };

        return new NextResponse(JSON.stringify(stats), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return new NextResponse(JSON.stringify({ error: "Failed to fetch stats" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
