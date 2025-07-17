const Database = require('better-sqlite3');
const path = require('path');

async function createDevData() {
  try {
    console.log('🗄️ Creating test data in development database...');
    
    // Connect to the development database
    const dbPath = path.join(__dirname, '..', 'dev.db');
    const db = new Database(dbPath);
    
    // Create test data directly
    console.log('👤 Creating user...');
    const userResult = db.prepare(`
      INSERT INTO users (id, email, first_name, last_name, role, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('user_001', 'john.doe@example.com', 'John', 'Doe', 'manager', 1);
    
    console.log('📋 Creating assessment type...');
    const typeResult = db.prepare(`
      INSERT INTO assessment_types (name, description, purpose, is_active) 
      VALUES (?, ?, ?, ?)
    `).run('Leadership Assessment', 'Comprehensive leadership evaluation', 'Identify leadership potential and development areas', 1);
    
    console.log('📅 Creating assessment period...');
    const periodResult = db.prepare(`
      INSERT INTO assessment_periods (name, start_date, end_date, is_active) 
      VALUES (?, ?, ?, ?)
    `).run('Q1 2024', '2024-01-01', '2024-03-31', 1);
    
    console.log('🏷️ Creating assessment category...');
    const categoryResult = db.prepare(`
      INSERT INTO assessment_categories (assessment_type_id, name, description, display_order, is_active) 
      VALUES (?, ?, ?, ?, ?)
    `).run(typeResult.lastInsertRowid, 'Communication Skills', 'Ability to communicate effectively', 1, 1);
    
    console.log('📄 Creating assessment template...');
    const templateResult = db.prepare(`
      INSERT INTO assessment_templates (assessment_type_id, name, version, description, is_active) 
      VALUES (?, ?, ?, ?, ?)
    `).run(typeResult.lastInsertRowid, 'Leadership Template', '1.0', 'Standard leadership assessment template', 1);
    
    console.log('✅ Test data created successfully!');
    console.log('\n📊 Created Data Summary:');
    console.log('========================');
    console.log(`👤 User: John Doe (john.doe@example.com) - Role: manager`);
    console.log(`📋 Assessment Type: Leadership Assessment - Comprehensive leadership evaluation`);
    console.log(`📅 Period: Q1 2024 (2024-01-01 to 2024-03-31)`);
    console.log(`🏷️ Category: Communication Skills - Ability to communicate effectively`);
    console.log(`📄 Template: Leadership Template v1.0`);
    
    console.log('\n🔍 You can now inspect the data in your development database (dev.db)');
    console.log('💡 Use a SQLite browser or run: sqlite3 dev.db "SELECT * FROM users;"');
    
    // Show some sample queries
    console.log('\n📋 Sample queries to inspect the data:');
    console.log('sqlite3 dev.db "SELECT id, email, first_name, last_name, role FROM users;"');
    console.log('sqlite3 dev.db "SELECT id, name, description FROM assessment_types;"');
    console.log('sqlite3 dev.db "SELECT id, name, start_date, end_date FROM assessment_periods;"');
    console.log('sqlite3 dev.db "SELECT id, name, version FROM assessment_templates;"');
    console.log('sqlite3 dev.db "SELECT id, name, description FROM assessment_categories;"');
    
    // Show the actual data
    console.log('\n📊 Current data in database:');
    console.log('Users:');
    const users = db.prepare('SELECT * FROM users').all();
    console.table(users);
    
    console.log('\nAssessment Types:');
    const types = db.prepare('SELECT * FROM assessment_types').all();
    console.table(types);
    
    console.log('\nAssessment Periods:');
    const periods = db.prepare('SELECT * FROM assessment_periods').all();
    console.table(periods);
    
    console.log('\nAssessment Templates:');
    const templates = db.prepare('SELECT * FROM assessment_templates').all();
    console.table(templates);
    
    console.log('\nAssessment Categories:');
    const categories = db.prepare('SELECT * FROM assessment_categories').all();
    console.table(categories);
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createDevData(); 