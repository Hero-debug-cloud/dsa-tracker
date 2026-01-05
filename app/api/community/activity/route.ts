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

// Cache for activity data (1 hour TTL)
let cachedActivity: any = null;
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
        const { searchParams } = new URL(req.url);
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
        const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 365;

        // Create cache key based on parameters
        const cacheKey = `${year}-${days}`;
        
        // Check cache first
        const now = Date.now();
        if (cachedActivity && cachedActivity.cacheKey === cacheKey && (now - cacheTimestamp) < CACHE_TTL) {
            return new NextResponse(JSON.stringify(cachedActivity.data), {
                status: 200,
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=3600"
                }
            });
        }

        // Calculate date range
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        // Fetch daily activity data aggregated across all users
        const activityResult = await client.execute(`
            WITH date_range AS (
                SELECT date('${startDate}') as date
                UNION ALL
                SELECT date(date, '+1 day')
                FROM date_range
                WHERE date < date('${endDate}')
            ),
            daily_activity AS (
                SELECT 
                    a.date,
                    COUNT(DISTINCT a.problem_id) as problemsSolved,
                    COUNT(DISTINCT a.user) as activeUsers
                FROM attempts a
                WHERE a.status = 'Solved' 
                    AND a.date >= '${startDate}'
                    AND a.date <= '${endDate}'
                GROUP BY a.date
            )
            SELECT 
                dr.date,
                COALESCE(da.problemsSolved, 0) as problemsSolved,
                COALESCE(da.activeUsers, 0) as activeUsers,
                CASE 
                    WHEN COALESCE(da.problemsSolved, 0) = 0 THEN 0
                    WHEN COALESCE(da.problemsSolved, 0) <= 2 THEN 1
                    WHEN COALESCE(da.problemsSolved, 0) <= 5 THEN 2
                    WHEN COALESCE(da.problemsSolved, 0) <= 10 THEN 3
                    ELSE 4
                END as intensity
            FROM date_range dr
            LEFT JOIN daily_activity da ON dr.date = da.date
            ORDER BY dr.date
            LIMIT ${days}
        `);

        const activityData = activityResult.rows.map(row => ({
            date: String(row.date),
            problemsSolved: Number(row.problemsSolved),
            activeUsers: Number(row.activeUsers),
            intensity: Number(row.intensity)
        }));

        // Cache the results
        cachedActivity = {
            cacheKey,
            data: activityData
        };
        cacheTimestamp = now;

        return new NextResponse(JSON.stringify(activityData), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600"
            }
        });
    } catch (error) {
        console.error("Error fetching community activity:", error);
        return new NextResponse(JSON.stringify({ error: "Failed to fetch community activity" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}