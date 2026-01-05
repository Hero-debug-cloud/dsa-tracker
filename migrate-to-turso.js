import { createClient } from "@libsql/client";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

// Initialize Turso DB client
const client = createClient({
  url: process.env.DB_URL,
  authToken: process.env.AUTH_TOKEN
});

async function migrateData() {
  console.log("Starting data migration to Turso DB...");
  
  try {
    // Read JSON files
    const problemsData = JSON.parse(fs.readFileSync('./data/problems.json', 'utf8'));
    const attemptsData = JSON.parse(fs.readFileSync('./data/attempts.json', 'utf8'));
    
    console.log(`Found ${problemsData.length} problems and ${attemptsData.length} attempts`);
    
    // Insert problems
    console.log("Inserting problems...");
    for (const problem of problemsData) {
      try {
        await client.execute(
          `INSERT OR IGNORE INTO problems 
           (id, platform, name, link, topic, difficulty) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            problem.id,
            problem.platform,
            problem.name,
            problem.link,
            problem.topic,
            problem.difficulty
          ]
        );
      } catch (err) {
        console.error(`Error inserting problem ${problem.id}:`, err.message);
      }
    }
    
    // Insert attempts
    console.log("Inserting attempts...");
    for (const attempt of attemptsData) {
      try {
        await client.execute(
          `INSERT OR IGNORE INTO attempts 
           (id, user, problem_id, date, status, time_taken, first_try, notes, solved_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            attempt.id,
            attempt.user,
            attempt.problem_id,
            attempt.date,
            attempt.status,
            attempt.time_taken || null,
            attempt.first_try ? 1 : 0,
            attempt.notes || "",
            attempt.solved_at || null
          ]
        );
      } catch (err) {
        console.error(`Error inserting attempt ${attempt.id}:`, err.message);
      }
    }
    
    console.log("Data migration completed successfully!");
    
    // Verify the data
    const problemsCount = await client.execute("SELECT COUNT(*) as count FROM problems");
    const attemptsCount = await client.execute("SELECT COUNT(*) as count FROM attempts");
    
    console.log(`Verification: ${problemsCount.rows[0].count} problems and ${attemptsCount.rows[0].count} attempts in Turso DB`);
    
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the client connection
    console.log("Migration process completed.");
  }
}

// Run the migration
migrateData();