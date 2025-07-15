const Database = require('better-sqlite3');

const db = new Database('dev.db');

console.log('🗄️ Setting up updated database schema...');

// Drop existing tables (for clean slate)
db.exec(`
  DROP TABLE IF EXISTS assessment_responses;
  DROP TABLE IF EXISTS assessment_instances;
  DROP TABLE IF EXISTS assessment_questions;
  DROP TABLE IF EXISTS manager_relationships;
  DROP TABLE IF EXISTS magic_links;
  DROP TABLE IF EXISTS assessment_periods;
  DROP TABLE IF EXISTS users;
`);

// Create updated tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
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

  CREATE TABLE IF NOT EXISTS assessment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    purpose TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assessment_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_type_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_type_id) REFERENCES assessment_types(id)
  );

  CREATE TABLE IF NOT EXISTS assessment_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_type_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_type_id) REFERENCES assessment_types(id),
    UNIQUE(name, version)
  );

  CREATE TABLE IF NOT EXISTS assessment_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES assessment_templates(id),
    FOREIGN KEY (category_id) REFERENCES assessment_categories(id)
  );

  CREATE TABLE IF NOT EXISTS assessment_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    period_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    started_at DATETIME,
    completed_at DATETIME,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (period_id) REFERENCES assessment_periods(id),
    FOREIGN KEY (template_id) REFERENCES assessment_templates(id)
  );

  CREATE TABLE IF NOT EXISTS assessment_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES assessment_instances(id),
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
  );

  CREATE TABLE IF NOT EXISTS manager_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manager_id TEXT NOT NULL,
    subordinate_id TEXT NOT NULL,
    period_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id),
    FOREIGN KEY (subordinate_id) REFERENCES users(id),
    FOREIGN KEY (period_id) REFERENCES assessment_periods(id)
  );

  CREATE TABLE IF NOT EXISTS invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manager_id TEXT NOT NULL,
    template_id INTEGER NOT NULL,
    period_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    status TEXT DEFAULT 'pending',
    token TEXT NOT NULL UNIQUE,
    invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    expires_at DATETIME NOT NULL,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent DATETIME,
    FOREIGN KEY (manager_id) REFERENCES users(id),
    FOREIGN KEY (template_id) REFERENCES assessment_templates(id),
    FOREIGN KEY (period_id) REFERENCES assessment_periods(id)
  );

  CREATE TABLE IF NOT EXISTS magic_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
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

const insertAssessmentType = db.prepare(`
  INSERT OR IGNORE INTO assessment_types (name, description, purpose)
  VALUES (?, ?, ?)
`);

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO assessment_categories (assessment_type_id, name, description, display_order)
  VALUES (?, ?, ?, ?)
`);

const insertTemplate = db.prepare(`
  INSERT OR IGNORE INTO assessment_templates (assessment_type_id, name, version, description)
  VALUES (?, ?, ?, ?)
`);

const insertQuestion = db.prepare(`
  INSERT OR IGNORE INTO assessment_questions (template_id, category_id, question_text, display_order)
  VALUES (?, ?, ?, ?)
`);

// Sample users
insertUser.run('super1', 'superadmin@example.com', 'Super', 'Admin', 'super-admin');
insertUser.run('admin1', 'admin@example.com', 'Admin', 'User', 'admin');
insertUser.run('manager1', 'manager@example.com', 'Manager', 'User', 'manager');
insertUser.run('employee1', 'employee@example.com', 'Employee', 'User', 'user');

// Sample assessment period
insertPeriod.run('Q1 2024', '2024-01-01', '2024-03-31', 1);

// Sample assessment types
insertAssessmentType.run(
  'Manager Self-Assessment',
  'Managers rate their own behaviors and habits',
  'Self-evaluation of leadership practices'
);

insertAssessmentType.run(
  'Team Member Assessment',
  'Team members rate how their manager shows up and leads',
  '360-degree feedback from direct reports'
);

insertAssessmentType.run(
  'Director MRI',
  'Senior leader observes team behavior to infer manager effectiveness',
  'External observation of team dynamics'
);

// Sample categories for Manager Self-Assessment
const managerCategories = [
  { name: 'Sage Mind', description: 'Staying calm, curious, and empathetic under pressure', order: 1 },
  { name: 'Relating', description: 'Building trust through asking, listening, including, coaching, and encouraging', order: 2 },
  { name: 'Requiring', description: 'Driving clarity and results through expectations, standards, follow-up, and confronting problems', order: 3 }
];

// Sample categories for Team Member Assessment
const teamCategories = [
  { name: 'Sageness', description: 'The team remains steady, calm, and thoughtful under pressure', order: 1 },
  { name: 'Trust & Psychological Safety', description: 'People feel safe to speak up and take risks', order: 2 },
  { name: 'Communication & Feedback', description: 'Clear direction, regular updates, and mutual feedback', order: 3 },
  { name: 'Engagement & Motivation', description: 'Visible energy, purpose, and care for growth', order: 4 },
  { name: 'Accountability & Performance', description: 'High standards, follow-through, and fairness', order: 5 },
  { name: 'Team Collaboration & Effectiveness', description: 'Seamless teamwork, clear meetings, and productive relationships', order: 6 }
];

// Sample categories for Director MRI
const directorCategories = [
  { name: 'Sageness', description: 'The team stays composed and clear-thinking under stress', order: 1 },
  { name: 'Trust & Psychological Safety', description: 'Issues are surfaced openly and treated as learning opportunities', order: 2 },
  { name: 'Communication & Feedback', description: 'Information flows clearly, usefully, and visibly shapes future work', order: 3 },
  { name: 'Engagement & Motivation', description: 'Work is done with care and linked to purpose; the team is eager to learn', order: 4 },
  { name: 'Accountability & Performance', description: 'The team hits deadlines, owns results, and applies consistent standards', order: 5 },
  { name: 'Team Collaboration & Effectiveness', description: 'Smooth handoffs, cross-coverage, and energizing, focused meetings', order: 6 }
];

// Insert categories for each assessment type
managerCategories.forEach((cat, index) => {
  insertCategory.run(1, cat.name, cat.description, cat.order);
});

teamCategories.forEach((cat, index) => {
  insertCategory.run(2, cat.name, cat.description, cat.order);
});

directorCategories.forEach((cat, index) => {
  insertCategory.run(3, cat.name, cat.description, cat.order);
});

// Insert templates
insertTemplate.run(1, 'Manager Self-Assessment', 'v1.0', 'Initial version of manager self-assessment');
insertTemplate.run(2, 'Team Member Assessment', 'v1.0', 'Initial version of team member assessment');
insertTemplate.run(3, 'Director MRI', 'v1.0', 'Initial version of director MRI assessment');

// Sample questions for Manager Self-Assessment (Sage Mind category)
const managerQuestions = [
  { categoryId: 1, text: 'I remain calm and composed when under pressure', order: 1 },
  { categoryId: 1, text: 'I approach challenges with curiosity rather than judgment', order: 2 },
  { categoryId: 1, text: 'I show empathy towards others during difficult situations', order: 3 },
  { categoryId: 2, text: 'I actively listen to understand others perspectives', order: 4 },
  { categoryId: 2, text: 'I ask thoughtful questions to help others think through problems', order: 5 },
  { categoryId: 2, text: 'I include diverse viewpoints in decision-making processes', order: 6 },
  { categoryId: 3, text: 'I set clear expectations for my team members', order: 7 },
  { categoryId: 3, text: 'I follow up on commitments and hold people accountable', order: 8 },
  { categoryId: 3, text: 'I address performance issues directly and constructively', order: 9 }
];

// Sample questions for Team Member Assessment
const teamQuestions = [
  { categoryId: 4, text: 'My manager helps the team stay calm under pressure', order: 1 },
  { categoryId: 4, text: 'My manager thinks clearly and makes good decisions when stressed', order: 2 },
  { categoryId: 5, text: 'I feel safe to speak up and share my ideas', order: 3 },
  { categoryId: 5, text: 'My manager encourages risk-taking and learning from mistakes', order: 4 },
  { categoryId: 6, text: 'My manager communicates clearly and provides regular updates', order: 5 },
  { categoryId: 6, text: 'My manager gives and receives feedback effectively', order: 6 },
  { categoryId: 7, text: 'My manager shows enthusiasm and energy for our work', order: 7 },
  { categoryId: 7, text: 'My manager cares about my growth and development', order: 8 },
  { categoryId: 8, text: 'My manager sets high standards and expects excellence', order: 9 },
  { categoryId: 8, text: 'My manager follows through on commitments and promises', order: 10 },
  { categoryId: 9, text: 'My manager facilitates effective team meetings', order: 11 },
  { categoryId: 9, text: 'My manager helps the team work together smoothly', order: 12 }
];

// Sample questions for Director MRI
const directorQuestions = [
  { categoryId: 10, text: 'The team remains composed and clear-thinking under stress', order: 1 },
  { categoryId: 10, text: 'The team approaches challenges thoughtfully and systematically', order: 2 },
  { categoryId: 11, text: 'Team members surface issues openly and constructively', order: 3 },
  { categoryId: 11, text: 'Mistakes are treated as learning opportunities', order: 4 },
  { categoryId: 12, text: 'Information flows clearly and shapes future work', order: 5 },
  { categoryId: 12, text: 'Communication is useful and visible to all team members', order: 6 },
  { categoryId: 13, text: 'Work is done with care and linked to purpose', order: 7 },
  { categoryId: 13, text: 'The team shows enthusiasm for learning and growth', order: 8 },
  { categoryId: 14, text: 'The team consistently hits deadlines and owns results', order: 9 },
  { categoryId: 14, text: 'The team applies consistent standards to their work', order: 10 },
  { categoryId: 15, text: 'Team handoffs are smooth and well-coordinated', order: 11 },
  { categoryId: 15, text: 'Team meetings are focused and energizing', order: 12 }
];

// Insert questions for each template
managerQuestions.forEach(q => {
  insertQuestion.run(1, q.categoryId, q.text, q.order);
});

teamQuestions.forEach(q => {
  insertQuestion.run(2, q.categoryId, q.text, q.order);
});

directorQuestions.forEach(q => {
  insertQuestion.run(3, q.categoryId, q.text, q.order);
});

console.log('✅ Updated database schema complete!');
console.log('📊 Sample data inserted:');
console.log('   - 4 users (super-admin, admin, manager, employee)');
console.log('   - 1 assessment period (Q1 2024)');
console.log('   - 3 assessment types (Manager Self, Team Member, Director MRI)');
console.log('   - 15 categories across all assessment types');
console.log('   - 3 assessment templates (v1.0)');
console.log('   - 33 sample questions across all templates');

db.close(); 