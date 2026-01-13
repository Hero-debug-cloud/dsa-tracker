-- Migration script to add topics table and update problems table

-- 1. Create the topics table if it doesn't exist
CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- 2. Add the topic_id column to the problems table if it doesn't exist
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN directly in older versions
-- So we'll recreate the table with the new structure

-- Create a temporary table with the new structure
CREATE TABLE problems_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT,
    name TEXT NOT NULL,
    link TEXT,
    topic TEXT,
    topic_id INTEGER,
    difficulty TEXT CHECK(difficulty IN ('Easy','Medium','Hard')) NOT NULL,
    FOREIGN KEY (topic_id) REFERENCES topics (id),
    UNIQUE(platform, name)
);

-- Copy data from the old problems table to the new one
INSERT INTO problems_new (id, platform, name, link, topic, difficulty)
SELECT id, platform, name, link, topic, difficulty
FROM problems;

-- Populate the topics table with unique topics
INSERT OR IGNORE INTO topics (name)
SELECT DISTINCT topic FROM problems WHERE topic IS NOT NULL;

-- Update the topic_id in the new problems table based on the topic name
UPDATE problems_new
SET topic_id = (SELECT id FROM topics WHERE name = problems_new.topic)
WHERE topic_id IS NULL;

-- Drop the old problems table
DROP TABLE problems;

-- Rename the new table to problems
ALTER TABLE problems_new RENAME TO problems;

-- Create indexes if needed
CREATE INDEX IF NOT EXISTS idx_problems_topic_id ON problems(topic_id);