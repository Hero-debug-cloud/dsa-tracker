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

// Cache for leaderboard data (30 minutes TTL)
let cachedLeaderboards: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

export async function GET(req: NextRequest) {
    const user = await authenticateToken(req);
    if (!user) {
        return new NextResponse(JSON.stringify({ error: "Access token required" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'all';
        const limit = parseInt(searchParams.get('limit') || '10');

        // Check cache first
        const now = Date.now();
        const cacheKey = `${type}-${limit}`;
        if (cachedLeaderboards && cachedLeaderboards.cacheKey === cacheKey && (now - cacheTimestamp) < CACHE_TTL) {
            return new NextResponse(JSON.stringify(cachedLeaderboards.data), {
                status: 200,
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=1800"
                }
            });
        }

        let leaderboardData: any = {};

        if (type === 'all' || type === 'totalSolved') {
            // Total problems solved leaderboard
            const totalSolvedResult = await client.execute(`
                SELECT 
                    u.id as userId,
                    u.name as username,
                    COUNT(DISTINCT a.problem_id) as value,
                    ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT a.problem_id) DESC) as rank
                FROM users u
                LEFT JOIN attempts a ON u.name = a.user AND a.status = 'Solved'
                GROUP BY u.id, u.name
                ORDER BY value DESC
                LIMIT ?
            `, [limit]);

            leaderboardData.totalSolved = totalSolvedResult.rows.map(row => ({
                userId: Number(row.userId),
                username: String(row.username),
                value: Number(row.value),
                rank: Number(row.rank)
            }));
        }

        if (type === 'all' || type === 'currentStreak') {
            // Current streak leaderboard (simplified calculation)
            const currentStreakResult = await client.execute(`
                WITH user_streaks AS (
                    SELECT 
                        u.name as username,
                        u.id as userId,
                        CASE 
                            WHEN MAX(a.date) >= date('now', '-1 day') THEN
                                COUNT(DISTINCT a.date)
                            ELSE 0
                        END as streak_value
                    FROM users u
                    LEFT JOIN attempts a ON u.name = a.user AND a.status = 'Solved'
                    GROUP BY u.id, u.name
                )
                SELECT 
                    userId,
                    username,
                    streak_value as value,
                    ROW_NUMBER() OVER (ORDER BY streak_value DESC) as rank
                FROM user_streaks
                ORDER BY value DESC
                LIMIT ?
            `, [limit]);

            leaderboardData.currentStreak = currentStreakResult.rows.map(row => ({
                userId: Number(row.userId),
                username: String(row.username),
                value: Number(row.value),
                rank: Number(row.rank)
            }));
        }

        if (type === 'all' || type === 'weeklyActivity') {
            // Weekly activity leaderboard
            const weeklyActivityResult = await client.execute(`
                SELECT 
                    u.id as userId,
                    u.name as username,
                    COUNT(DISTINCT a.problem_id) as value,
                    ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT a.problem_id) DESC) as rank
                FROM users u
                LEFT JOIN attempts a ON u.name = a.user 
                    AND a.status = 'Solved' 
                    AND a.date >= date('now', '-7 days')
                GROUP BY u.id, u.name
                ORDER BY value DESC
                LIMIT ?
            `, [limit]);

            leaderboardData.weeklyActivity = weeklyActivityResult.rows.map(row => ({
                userId: Number(row.userId),
                username: String(row.username),
                value: Number(row.value),
                rank: Number(row.rank)
            }));
        }

        // If specific type requested, return only that type
        if (type !== 'all') {
            const result = leaderboardData[type] || [];
            return new NextResponse(JSON.stringify(result), {
                status: 200,
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=1800"
                }
            });
        }

        // Cache the results
        cachedLeaderboards = {
            cacheKey,
            data: leaderboardData
        };
        cacheTimestamp = now;

        return new NextResponse(JSON.stringify(leaderboardData), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=1800"
            }
        });
    } catch (error) {
        console.error("Error fetching leaderboards:", error);
        return new NextResponse(JSON.stringify({ error: "Failed to fetch leaderboards" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}