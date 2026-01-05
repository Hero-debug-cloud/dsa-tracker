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

// Cache for activity feed (5 minutes TTL)
let cachedFeed: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

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
        const limit = parseInt(searchParams.get('limit') || '20');
        const since = searchParams.get('since') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default to 7 days ago

        // Check cache first
        const now = Date.now();
        const cacheKey = `${limit}-${since}`;
        if (cachedFeed && cachedFeed.cacheKey === cacheKey && (now - cacheTimestamp) < CACHE_TTL) {
            return new NextResponse(JSON.stringify(cachedFeed.data), {
                status: 200,
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=300"
                }
            });
        }

        // Fetch recent activity feed
        const activityFeedResult = await client.execute(`
            WITH recent_solves AS (
                SELECT 
                    a.user,
                    u.id as userId,
                    a.date,
                    a.solved_at,
                    p.name as problemName,
                    p.difficulty,
                    COUNT(*) OVER (PARTITION BY a.user, a.date) as daily_count,
                    ROW_NUMBER() OVER (PARTITION BY a.user, a.date ORDER BY a.solved_at DESC) as rn
                FROM attempts a
                JOIN users u ON u.name = a.user
                JOIN problems p ON p.id = a.problem_id
                WHERE a.status = 'Solved' 
                    AND a.date >= ?
                ORDER BY a.date DESC, a.solved_at DESC
            ),
            streak_milestones AS (
                SELECT 
                    user,
                    userId,
                    date,
                    daily_count,
                    CASE 
                        WHEN daily_count >= 10 THEN '10+ problems in a day'
                        WHEN daily_count >= 5 THEN '5+ problems in a day'
                        WHEN daily_count >= 3 THEN '3+ problems in a day'
                        ELSE NULL
                    END as milestone_type
                FROM recent_solves
                WHERE rn = 1 AND daily_count >= 3
            ),
            difficulty_milestones AS (
                SELECT DISTINCT
                    user,
                    userId,
                    date,
                    difficulty
                FROM (
                    SELECT DISTINCT
                        a.user,
                        u.id as userId,
                        a.date,
                        p.difficulty,
                        COUNT(*) OVER (PARTITION BY a.user, p.difficulty) as difficulty_count
                    FROM attempts a
                    JOIN users u ON u.name = a.user
                    JOIN problems p ON p.id = a.problem_id
                    WHERE a.status = 'Solved' 
                        AND a.date >= ?
                        AND p.difficulty = 'Hard'
                ) subq
                WHERE difficulty_count = 1
            )
            SELECT 
                'problem_solved' as type,
                rs.userId,
                rs.user as username,
                rs.date as timestamp,
                CASE 
                    WHEN rs.daily_count = 1 THEN rs.user || ' solved ' || rs.problemName || ' (' || rs.difficulty || ')'
                    ELSE rs.user || ' solved ' || rs.daily_count || ' problems today'
                END as description,
                json_object('problemName', rs.problemName, 'difficulty', rs.difficulty, 'dailyCount', rs.daily_count) as metadata
            FROM recent_solves rs
            WHERE rs.rn = 1
            
            UNION ALL
            
            SELECT 
                'streak_milestone' as type,
                sm.userId,
                sm.user as username,
                sm.date as timestamp,
                sm.user || ' achieved ' || sm.milestone_type as description,
                json_object('milestoneType', sm.milestone_type, 'count', sm.daily_count) as metadata
            FROM streak_milestones sm
            WHERE sm.milestone_type IS NOT NULL
            
            UNION ALL
            
            SELECT 
                'difficulty_milestone' as type,
                dm.userId,
                dm.user as username,
                dm.date as timestamp,
                dm.user || ' solved their first ' || dm.difficulty || ' problem!' as description,
                json_object('difficulty', dm.difficulty) as metadata
            FROM difficulty_milestones dm
            
            ORDER BY timestamp DESC
            LIMIT ?
        `, [since, since, limit]);

        const activityFeed = activityFeedResult.rows.map((row, index) => ({
            id: `${row.type}-${row.userId}-${row.timestamp}-${index}`,
            userId: Number(row.userId),
            username: String(row.username),
            type: String(row.type),
            description: String(row.description),
            timestamp: String(row.timestamp),
            metadata: row.metadata ? JSON.parse(String(row.metadata)) : {}
        }));

        // Cache the results
        cachedFeed = {
            cacheKey,
            data: activityFeed
        };
        cacheTimestamp = now;

        return new NextResponse(JSON.stringify(activityFeed), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=300"
            }
        });
    } catch (error) {
        console.error("Error fetching activity feed:", error);
        return new NextResponse(JSON.stringify({ error: "Failed to fetch activity feed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}