const Database = require('better-sqlite3');

const db = new Database('dev.db');

console.log('🗄️ Setting up database...');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assessment_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assessment_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    period_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assessment_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS assessment_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS magic_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS manager_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manager_id TEXT NOT NULL,
    subordinate_id TEXT NOT NULL,
    period_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert sample data
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, email, first_name, last_name, role)
  VALUES (?, ?, ?, ?, ?)
`);

const insertPeriod = db.prepare(`
  INSERT OR IGNORE INTO assessment_periods (name, start_date, end_date, is_active)
  VALUES (?, ?, ?, ?)
`);

const insertQuestion = db.prepare(`
  INSERT OR IGNORE INTO assessment_questions (category, text, "order")
  VALUES (?, ?, ?)
`);

// Sample users with super-admin role
insertUser.run('super1', 'superadmin@example.com', 'Super', 'Admin', 'super-admin');
insertUser.run('admin1', 'admin@example.com', 'Admin', 'User', 'admin');
insertUser.run('manager1', 'manager@example.com', 'Manager', 'User', 'manager');
insertUser.run('employee1', 'employee@example.com', 'Employee', 'User', 'user');

// Sample assessment period
insertPeriod.run('Q1 2024', '2024-01-01', '2024-03-31', 1);

// Sample questions
const questions = [
  { category: 'leadership', text: 'I effectively communicate vision and goals to my team', order: 1 },
  { category: 'leadership', text: 'I provide constructive feedback to help others grow', order: 2 },
  { category: 'leadership', text: 'I lead by example and demonstrate integrity', order: 3 },
  { category: 'communication', text: 'I listen actively and respond appropriately', order: 4 },
  { category: 'communication', text: 'I express my ideas clearly and concisely', order: 5 },
  { category: 'communication', text: 'I adapt my communication style to different audiences', order: 6 },
  { category: 'teamwork', text: 'I collaborate effectively with team members', order: 7 },
  { category: 'teamwork', text: 'I contribute to a positive team environment', order: 8 },
  { category: 'teamwork', text: 'I support others and share knowledge willingly', order: 9 },
];

questions.forEach(q => {
  insertQuestion.run(q.category, q.text, q.order);
});

console.log('✅ Database setup complete!');
console.log('📊 Sample data inserted:');
console.log('   - 4 users (super-admin, admin, manager, employee)');
console.log('   - 1 assessment period (Q1 2024)');
console.log('   - 9 assessment questions');

db.close();
