-- Assessment Tracker Database Queries
-- Use these queries in SQLtools to explore your data

-- 1. View all tables
SELECT name FROM sqlite_master WHERE type='table';

-- 2. View all users
SELECT * FROM users;

-- 3. View assessment periods
SELECT * FROM assessment_periods;

-- 4. View assessment questions by category
SELECT category, COUNT(*) as question_count 
FROM assessment_questions 
GROUP BY category;

-- 5. View all assessment questions
SELECT * FROM assessment_questions ORDER BY category, "order";

-- 6. View magic links (recent ones)
SELECT email, created_at, used, expires_at 
FROM magic_links 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. View assessment instances
SELECT 
  ai.id,
  u.email as user_email,
  ap.name as period_name,
  ai.type,
  ai.status,
  ai.completed_at
FROM assessment_instances ai
JOIN users u ON ai.user_id = u.id
JOIN assessment_periods ap ON ai.period_id = ap.id;

-- 8. View manager relationships
SELECT 
  mr.id,
  m.email as manager_email,
  s.email as subordinate_email,
  ap.name as period_name
FROM manager_relationships mr
JOIN users m ON mr.manager_id = m.id
JOIN users s ON mr.subordinate_id = s.id
JOIN assessment_periods ap ON mr.period_id = ap.id;

-- 9. Count users by role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- 10. View database schema
SELECT sql FROM sqlite_master WHERE type='table'; 