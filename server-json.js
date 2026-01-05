import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const USERS = ["Akshaya", "Arpan"];

/* ============================================================
   DATA STORAGE HELPERS
============================================================ */

// Data file paths
const PROBLEMS_FILE = 'data/problems.json';
const ATTEMPTS_FILE = 'data/attempts.json';

// Ensure data directory exists
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}

// Helper functions to read/write JSON files
function readProblems() {
  try {
    if (!fs.existsSync(PROBLEMS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(PROBLEMS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading problems:', error);
    return [];
  }
}

function writeProblems(problems) {
  try {
    fs.writeFileSync(PROBLEMS_FILE, JSON.stringify(problems, null, 2));
  } catch (error) {
    console.error('Error writing problems:', error);
  }
}

function readAttempts() {
  try {
    if (!fs.existsSync(ATTEMPTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(ATTEMPTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading attempts:', error);
    return [];
  }
}

function writeAttempts(attempts) {
  try {
    fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
  } catch (error) {
    console.error('Error writing attempts:', error);
  }
}

// Generate unique IDs
function generateId(items) {
  return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
}

/* ============================================================
   PROBLEMS
============================================================ */
app.post("/problems", (req, res) => {
  const p = req.body;
  const problems = readProblems();

  // Check for duplicates (platform + name)
  const exists = problems.find(prob =>
    prob.platform === p.platform && prob.name === p.name
  );

  if (!exists) {
    const newProblem = {
      id: generateId(problems),
      platform: p.platform,
      name: p.name,
      link: p.link,
      topic: p.topic,
      difficulty: p.difficulty
    };
    problems.push(newProblem);
    writeProblems(problems);
  }

  res.json({ success: true });
});

app.get("/problems", (req, res) => {
  const user = req.query.user || null;
  const problems = readProblems();
  const attempts = readAttempts();

  const result = problems.map(p => {
    // Find latest attempt for this problem and user
    const userAttempts = attempts.filter(a =>
      a.problem_id === p.id && (user === null || a.user === user)
    );

    const latestAttempt = userAttempts.length > 0
      ? userAttempts.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      : null;

    // Find all users who solved this problem
    const solvedByUsers = attempts
      .filter(a => a.problem_id === p.id && a.status === 'Solved')
      .map(a => a.user)
      .filter((user, index, arr) => arr.indexOf(user) === index) // unique users
      .join(',');

    return {
      ...p,
      status: latestAttempt?.status || null,
      time_taken: latestAttempt?.time_taken || null,
      first_try: latestAttempt?.first_try || null,
      date: latestAttempt?.date || null,
      solved_by_users: solvedByUsers || null
    };
  });

  // Sort by difficulty then name
  result.sort((a, b) => {
    const diffOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    const diffCompare = diffOrder[a.difficulty] - diffOrder[b.difficulty];
    return diffCompare !== 0 ? diffCompare : a.name.localeCompare(b.name);
  });

  res.json(result);
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
  const problems = readProblems();
  const problemExists = problems.find(p => p.id === a.problem_id);
  if (!problemExists) {
    return res.status(400).json({
      error: "Problem ID does not exist"
    });
  }

  try {
    const attempts = readAttempts();
    const solvedAt = a.status === "Solved" ? a.date : null;

    const newAttempt = {
      id: generateId(attempts),
      user: a.user,
      problem_id: a.problem_id,
      date: a.date,
      status: a.status,
      time_taken: a.time_taken || null,
      first_try: a.first_try ? 1 : 0,
      notes: a.notes || "",
      solved_at: solvedAt
    };

    attempts.push(newAttempt);
    writeAttempts(attempts);

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding attempt:", error);
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

  const attempts = readAttempts();
  const problems = readProblems();

  const result = attempts
    .filter(a => a.user === user)
    .map(a => {
      const problem = problems.find(p => p.id === a.problem_id);
      return {
        ...a,
        problem_name: problem?.name || `Problem ${a.problem_id}`,
        topic: problem?.topic || '',
        difficulty: problem?.difficulty || ''
      };
    })
    .sort((a, b) => {
      // Sort by date desc, then id desc
      const dateCompare = new Date(b.date) - new Date(a.date);
      return dateCompare !== 0 ? dateCompare : b.id - a.id;
    });

  res.json(result);
});

/* ============================================================
   STATS
============================================================ */
app.get("/stats/:user", (req, res) => {
  const user = req.params.user;
  const problems = readProblems();
  const attempts = readAttempts().filter(a => a.user === user);

  if (attempts.length === 0) {
    return res.json({
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
    });
  }

  // Get unique problems attempted
  const uniqueProblemsAttempted = [...new Set(attempts.map(a => a.problem_id))];

  // Get unique problems solved
  const uniqueProblemsSolved = [...new Set(
    attempts.filter(a => a.status === 'Solved').map(a => a.problem_id)
  )];

  // Calculate first-try accuracy (first attempt for each problem was successful)
  const firstTrySuccesses = uniqueProblemsAttempted.filter(problemId => {
    const problemAttempts = attempts.filter(a => a.problem_id === problemId);
    const firstAttempt = problemAttempts.sort((a, b) => a.id - b.id)[0];
    return firstAttempt.status === 'Solved';
  }).length;

  // Difficulty breakdown
  const solvedWithDifficulty = attempts
    .filter(a => a.status === 'Solved')
    .map(a => {
      const problem = problems.find(p => p.id === a.problem_id);
      return problem?.difficulty;
    })
    .filter((difficulty, index, arr) => {
      // Only count unique problems per difficulty
      const problemId = attempts.filter(a => a.status === 'Solved')[index]?.problem_id;
      return arr.findIndex((d, i) => {
        const pid = attempts.filter(a => a.status === 'Solved')[i]?.problem_id;
        return pid === problemId;
      }) === index;
    });

  const easySolved = solvedWithDifficulty.filter(d => d === 'Easy').length;
  const mediumSolved = solvedWithDifficulty.filter(d => d === 'Medium').length;
  const hardSolved = solvedWithDifficulty.filter(d => d === 'Hard').length;

  // Calculate other stats
  const totalAttempts = attempts.length;
  const solvedAttempts = attempts.filter(a => a.status === 'Solved');
  const revisitAttempts = attempts.filter(a => a.status === 'Revisit');
  const earlyFailures = attempts.filter(a => a.first_try === 0 && a.status !== 'Solved');

  // Medium difficulty average time
  const mediumSolvedAttempts = attempts.filter(a => {
    const problem = problems.find(p => p.id === a.problem_id);
    return a.status === 'Solved' && problem?.difficulty === 'Medium' && a.time_taken;
  });
  const avgMediumTime = mediumSolvedAttempts.length > 0
    ? Math.round(mediumSolvedAttempts.reduce((sum, a) => sum + a.time_taken, 0) / mediumSolvedAttempts.length * 10) / 10
    : null;

  // Active days and pace
  const uniqueDates = [...new Set(attempts.map(a => a.date))];
  const activeDays = uniqueDates.length;
  const problemsPerDay = activeDays > 0 ? Math.round(uniqueProblemsAttempted.length / activeDays * 100) / 100 : 0;

  // Last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSolved = [...new Set(
    attempts
      .filter(a => a.status === 'Solved' && new Date(a.date) >= sevenDaysAgo)
      .map(a => a.problem_id)
  )].length;

  // Difficulty progression
  const allAttemptedDifficulties = attempts.map(a => {
    const problem = problems.find(p => p.id === a.problem_id);
    const diffValue = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    return diffValue[problem?.difficulty] || 1;
  });
  const difficultyProgression = allAttemptedDifficulties.length > 0
    ? Math.round(allAttemptedDifficulties.reduce((sum, d) => sum + d, 0) / allAttemptedDifficulties.length * 100) / 100
    : 0;

  // Re-solve success rate
  const revisitNotes = attempts.filter(a => a.notes && a.notes.toLowerCase().includes('revisit'));
  const revisitSolved = revisitNotes.filter(a => a.status === 'Solved');
  const ressolveSuccess = revisitNotes.length > 0
    ? Math.round(revisitSolved.length / revisitNotes.length * 100) / 100
    : null;

  const stats = {
    attempted: uniqueProblemsAttempted.length,
    solved: uniqueProblemsSolved.length,
    completion_percent: Math.round(uniqueProblemsSolved.length / problems.length * 1000) / 10,
    easy_solved: easySolved,
    medium_solved: mediumSolved,
    hard_solved: hardSolved,
    first_try_accuracy: Math.round(firstTrySuccesses / uniqueProblemsAttempted.length * 10000) / 100,
    early_failure_rate: Math.round(earlyFailures.length / totalAttempts * 10000) / 100,
    avg_medium_time: avgMediumTime,
    pending_revisits: revisitAttempts.length,
    ressolve_success: ressolveSuccess,
    active_days: activeDays,
    problems_per_day: problemsPerDay,
    solved_last_7_days: recentSolved,
    difficulty_progression_index: difficultyProgression
  };

  res.json(stats);
});

/* ============================================================
   TOPIC MASTERY & WEAKNESS
============================================================ */
app.get("/stats/:user/topics", (req, res) => {
  const user = req.params.user;
  const problems = readProblems();
  const attempts = readAttempts().filter(a => a.user === user);

  // Group attempts by topic
  const topicStats = {};

  attempts.forEach(a => {
    const problem = problems.find(p => p.id === a.problem_id);
    if (!problem) return;

    const topic = problem.topic;
    if (!topicStats[topic]) {
      topicStats[topic] = {
        topic,
        attempts: 0,
        solved: 0,
        difficulties: []
      };
    }

    topicStats[topic].attempts++;
    if (a.status === 'Solved') {
      topicStats[topic].solved++;
    }
    topicStats[topic].difficulties.push(problem.difficulty);
  });

  // Calculate mastery scores
  const result = Object.values(topicStats)
    .filter(t => t.attempts >= 3) // Only topics with 3+ attempts
    .map(t => {
      const solveRate = Math.round(t.solved / t.attempts * 100) / 100;
      const avgDifficulty = t.difficulties.reduce((sum, d) => {
        const diffValue = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        return sum + (diffValue[d] || 1);
      }, 0) / t.difficulties.length;

      return {
        topic: t.topic,
        attempts: t.attempts,
        solved: t.solved,
        solve_rate: solveRate,
        mastery_score: Math.round(solveRate * avgDifficulty * 100) / 100
      };
    })
    .sort((a, b) => a.mastery_score - b.mastery_score); // Ascending order (weakest first)

  res.json(result);
});

/* ============================================================
   COLD REVISITS
============================================================ */
app.get("/stats/:user/cold-revisits", (req, res) => {
  const user = req.params.user;
  const attempts = readAttempts().filter(a => a.user === user);

  const coldSuccess = attempts.filter(a => {
    if (a.status !== 'Solved' || !a.solved_at) return false;

    const solvedDate = new Date(a.date);
    const originalSolvedDate = new Date(a.solved_at);
    const daysDiff = (solvedDate - originalSolvedDate) / (1000 * 60 * 60 * 24);

    return daysDiff >= 14;
  }).length;

  res.json({ cold_success: coldSuccess });
});

/* ============================================================
   LEADERBOARD
============================================================ */
app.get("/leaderboard", (req, res) => {
  const problems = readProblems();
  const attempts = readAttempts();

  // Group by user
  const userStats = {};

  attempts.forEach(a => {
    if (!userStats[a.user]) {
      userStats[a.user] = {
        user: a.user,
        solvedProblems: new Set(),
        mediumHardSolved: new Set()
      };
    }

    if (a.status === 'Solved') {
      userStats[a.user].solvedProblems.add(a.problem_id);

      const problem = problems.find(p => p.id === a.problem_id);
      if (problem && (problem.difficulty === 'Medium' || problem.difficulty === 'Hard')) {
        userStats[a.user].mediumHardSolved.add(a.problem_id);
      }
    }
  });

  const result = Object.values(userStats)
    .map(u => ({
      user: u.user,
      solved: u.solvedProblems.size,
      medium_hard: u.mediumHardSolved.size
    }))
    .sort((a, b) => {
      // Sort by medium_hard desc, then solved desc
      return b.medium_hard - a.medium_hard || b.solved - a.solved;
    });

  res.json(result);
});

/* ============================================================
   SERVER
============================================================ */
app.listen(3000, () =>
  console.log("DSA Tracker (JSON) backend running → http://localhost:3000")
);