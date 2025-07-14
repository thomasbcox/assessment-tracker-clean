const Database = require('better-sqlite3');

const db = new Database('dev.db');

console.log('🗄️ Database Browser');
console.log('==================\n');

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('📋 Tables:');
tables.forEach(table => console.log(`  - ${table.name}`));
console.log('');

// Show users
console.log('👥 Users:');
const users = db.prepare('SELECT * FROM users').all();
users.forEach(user => {
  console.log(`  ${user.id}: ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
});
console.log('');

// Show assessment periods
console.log('📅 Assessment Periods:');
const periods = db.prepare('SELECT * FROM assessment_periods').all();
periods.forEach(period => {
  console.log(`  ${period.id}: ${period.name} (${period.startDate} to ${period.endDate}) - ${period.isActive ? 'Active' : 'Inactive'}`);
});
console.log('');

// Show questions count
const questionCount = db.prepare('SELECT COUNT(*) as count FROM assessment_questions').get();
console.log(`❓ Assessment Questions: ${questionCount.count} total`);

// Show categories
const categories = db.prepare('SELECT DISTINCT category FROM assessment_questions').all();
console.log('  Categories:', categories.map(c => c.category).join(', '));
console.log('');

// Show magic links count
const magicLinkCount = db.prepare('SELECT COUNT(*) as count FROM magic_links').get();
console.log(`🔗 Magic Links: ${magicLinkCount.count} total`);

db.close(); 