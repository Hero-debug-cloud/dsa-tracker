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

// Cache for community goals (15 minutes TTL)
let cachedGoals: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

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
        if (cachedGoals && (now - cacheTimestamp) < CACHE_TTL) {
            return new NextResponse(JSON.stringify(cachedGoals), {
                status: 200,
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=900"
                }
            });
        }

        // Get current date for goal calculations
        const currentDate = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const startOfMonth = `${currentMonth}-01`;
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

        // Fetch current progress for various goal types
        const goalsProgressResult = await client.execute(`
            WITH monthly_problems AS (
                SELECT COUNT(DISTINCT problem_id) as current_problems
                FROM attempts 
                WHERE status = 'Solved' 
                    AND date >= ? 
                    AND date <= ?
            ),
            monthly_active_users AS (
                SELECT COUNT(DISTINCT user) as current_users
                FROM attempts 
                WHERE date >= ? 
                    AND date <= ?
            ),
            community_streak_days AS (
                SELECT COUNT(DISTINCT date) as current_streak
                FROM attempts 
                WHERE status = 'Solved' 
                    AND date >= (
                        SELECT COALESCE(MAX(consecutive_date), ?) 
                        FROM (
                            SELECT date as consecutive_date,
                                   ROW_NUMBER() OVER (ORDER BY date DESC) - 
                                   ROW_NUMBER() OVER (PARTITION BY date ORDER BY date DESC) as grp
                            FROM (
                                SELECT DISTINCT date 
                                FROM attempts 
                                WHERE status = 'Solved'
                                    AND date <= ?
                                ORDER BY date DESC
                            )
                        ) 
                        WHERE grp = 0
                    )
            )
            SELECT 
                (SELECT current_problems FROM monthly_problems) as monthly_problems_current,
                (SELECT current_users FROM monthly_active_users) as monthly_users_current,
                (SELECT current_streak FROM community_streak_days) as streak_current
        `, [startOfMonth, endOfMonth, startOfMonth, endOfMonth, currentDate, currentDate]);

        const progressData = goalsProgressResult.rows[0];

        // Define community goals (these could be stored in database in a real implementation)
        const communityGoals = [
            {
                id: "monthly-problems-goal",
                title: "Monthly Problem Challenge",
                description: "Solve 100 problems as a community this month",
                target: 100,
                current: Number(progressData.monthly_problems_current) || 0,
                startDate: startOfMonth,
                endDate: endOfMonth,
                type: "problems",
                isActive: true
            },
            {
                id: "active-users-goal",
                title: "Community Engagement",
                description: "Get 10 users active this month",
                target: 10,
                current: Number(progressData.monthly_users_current) || 0,
                startDate: startOfMonth,
                endDate: endOfMonth,
                type: "users",
                isActive: true
            },
            {
                id: "community-streak-goal",
                title: "Community Streak Challenge",
                description: "Maintain a 30-day community streak",
                target: 30,
                current: Number(progressData.streak_current) || 0,
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                type: "streak",
                isActive: true
            }
        ];

        // Cache the results
        cachedGoals = communityGoals;
        cacheTimestamp = now;

        return new NextResponse(JSON.stringify(communityGoals), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=900"
            }
        });
    } catch (error) {
        console.error("Error fetching community goals:", error);
        return new NextResponse(JSON.stringify({ error: "Failed to fetch community goals" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}