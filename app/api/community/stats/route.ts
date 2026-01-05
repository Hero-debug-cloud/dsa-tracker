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

// Cache for community stats (1 hour TTL)
let cachedStats: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET(req: NextRequest) {
    const user = await authenticateToken(req);
    if (!user) {
        return new NextResponse(JSON.stringify({ error: "Access token required" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        // Check cache first
        const now = Date.now();
        if (cachedStats && (now - cacheTimestamp) < CACHE_TTL) {
            return new NextResponse(JSON.stringify(cachedStats), {
                status: 200,
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=3600"
                }
            });
        }

        // Fetch community statistics
        const communityStatsResult = await client.execute(`
            WITH total_users AS (
                SELECT COUNT(*) as total_users FROM users
            ),
            active_users_this_week AS (
                SELECT COUNT(DISTINCT user) as active_users_this_week
                FROM attempts 
                WHERE date >= date('now', '-7 days')
            ),
            problems_this_week AS (
                SELECT COUNT(DISTINCT problem_id) as problems_this_week
                FROM attempts 
                WHERE status = 'Solved' AND date >= date('now', '-7 days')
            ),
            total_problems_solved AS (
                SELECT COUNT(DISTINCT problem_id) as total_problems
                FROM attempts 
                WHERE status = 'Solved'
            ),
            difficulty_stats AS (
                SELECT 
                    p.difficulty,
                    COUNT(DISTINCT a.problem_id) as count
                FROM attempts a
                JOIN problems p ON p.id = a.problem_id
                WHERE a.status = 'Solved'
                GROUP BY p.difficulty
                ORDER BY count DESC
                LIMIT 1
            ),
            community_streak AS (
                SELECT COUNT(DISTINCT date) as streak_days
                FROM attempts 
                WHERE status = 'Solved' 
                AND date >= (
                    SELECT MIN(consecutive_date) 
                    FROM (
                        SELECT date as consecutive_date,
                               ROW_NUMBER() OVER (ORDER BY date DESC) - 
                               ROW_NUMBER() OVER (PARTITION BY date ORDER BY date DESC) as grp
                        FROM (
                            SELECT DISTINCT date 
                            FROM attempts 
                            WHERE status = 'Solved'
                            ORDER BY date DESC
                        )
                    ) 
                    WHERE grp = 0
                )
            ),
            weekly_growth AS (
                SELECT 
                    COUNT(DISTINCT CASE WHEN date >= date('now', '-7 days') THEN problem_id END) as this_week,
                    COUNT(DISTINCT CASE WHEN date >= date('now', '-14 days') AND date < date('now', '-7 days') THEN problem_id END) as last_week
                FROM attempts 
                WHERE status = 'Solved'
            )
            SELECT 
                (SELECT total_problems FROM total_problems_solved) as totalProblems,
                (SELECT active_users_this_week FROM active_users_this_week) as activeUsersThisWeek,
                (SELECT streak_days FROM community_streak) as communityStreak,
                (SELECT total_users FROM total_users) as totalUsers,
                (SELECT problems_this_week FROM problems_this_week) as problemsThisWeek,
                COALESCE((SELECT difficulty FROM difficulty_stats), 'easy') as mostPopularDifficulty,
                CASE 
                    WHEN (SELECT total_users FROM total_users) > 0 
                    THEN ROUND((SELECT total_problems FROM total_problems_solved) * 1.0 / (SELECT total_users FROM total_users), 2)
                    ELSE 0 
                END as averageProblemsPerUser,
                CASE 
                    WHEN (SELECT last_week FROM weekly_growth) > 0 
                    THEN ROUND(((SELECT this_week FROM weekly_growth) - (SELECT last_week FROM weekly_growth)) * 100.0 / (SELECT last_week FROM weekly_growth), 1)
                    ELSE 0 
                END as weeklyGrowth
        `);

        const statsRow = communityStatsResult.rows[0];
        
        const communityStats = {
            totalProblems: Number(statsRow.totalProblems) || 0,
            activeUsersThisWeek: Number(statsRow.activeUsersThisWeek) || 0,
            communityStreak: Number(statsRow.communityStreak) || 0,
            averageProblemsPerUser: Number(statsRow.averageProblemsPerUser) || 0,
            totalUsers: Number(statsRow.totalUsers) || 0,
            problemsThisWeek: Number(statsRow.problemsThisWeek) || 0,
            mostPopularDifficulty: String(statsRow.mostPopularDifficulty) || "easy",
            weeklyGrowth: Number(statsRow.weeklyGrowth) || 0
        };

        // Cache the results
        cachedStats = communityStats;
        cacheTimestamp = now;

        return new NextResponse(JSON.stringify(communityStats), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600"
            }
        });
    } catch (error) {
        console.error("Error fetching community stats:", error);
        return new NextResponse(JSON.stringify({ error: "Failed to fetch community stats" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}