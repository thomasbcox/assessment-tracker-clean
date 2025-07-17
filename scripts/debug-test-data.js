const Database = require('better-sqlite3');
const path = require('path');

async function debugTestData() {
  try {
    console.log('🔍 Debugging test data creation...');
    
    // Create in-memory test database
    const connection = new Database(':memory:');
    
    // Initialize schema (same as test)
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessment_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        purpose TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessment_periods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_active INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessment_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assessment_type_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assessment_type_id) REFERENCES assessment_types(id),
        UNIQUE(name, version)
      );

      CREATE TABLE IF NOT EXISTS assessment_instances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        period_id INTEGER NOT NULL,
        template_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        started_at TEXT,
        completed_at TEXT,
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (period_id) REFERENCES assessment_periods(id),
        FOREIGN KEY (template_id) REFERENCES assessment_templates(id)
      );
    `);
    
    console.log('✅ Schema created successfully');
    
    // Step 1: Create a user
    console.log('\n👤 Step 1: Creating user...');
    const userResult = connection.prepare(`
      INSERT INTO users (id, email, first_name, last_name, role, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('user_001', 'test@example.com', 'Test', 'User', 'user', 1);
    
    console.log('✅ User created with ID:', userResult.lastInsertRowid);
    
    // Step 2: Create an assessment type
    console.log('\n📋 Step 2: Creating assessment type...');
    const typeResult = connection.prepare(`
      INSERT INTO assessment_types (name, description, purpose, is_active) 
      VALUES (?, ?, ?, ?)
    `).run('Test Type', 'Test description', 'Test purpose', 1);
    
    console.log('✅ Assessment type created with ID:', typeResult.lastInsertRowid);
    
    // Step 3: Create an assessment period
    console.log('\n📅 Step 3: Creating assessment period...');
    const periodResult = connection.prepare(`
      INSERT INTO assessment_periods (name, start_date, end_date, is_active) 
      VALUES (?, ?, ?, ?)
    `).run('Test Period', '2024-01-01', '2024-12-31', 0);
    
    console.log('✅ Assessment period created with ID:', periodResult.lastInsertRowid);
    
    // Step 4: Create an assessment template
    console.log('\n📄 Step 4: Creating assessment template...');
    const templateResult = connection.prepare(`
      INSERT INTO assessment_templates (assessment_type_id, name, version, description, is_active) 
      VALUES (?, ?, ?, ?, ?)
    `).run(typeResult.lastInsertRowid, 'Test Template', '1.0', 'Test template', 1);
    
    console.log('✅ Assessment template created with ID:', templateResult.lastInsertRowid);
    
    // Step 5: Create an assessment instance
    console.log('\n📝 Step 5: Creating assessment instance...');
    console.log('Using:');
    console.log('  - user_id:', 'user_001');
    console.log('  - period_id:', periodResult.lastInsertRowid);
    console.log('  - template_id:', templateResult.lastInsertRowid);
    
    try {
      const instanceResult = connection.prepare(`
        INSERT INTO assessment_instances (user_id, period_id, template_id, status) 
        VALUES (?, ?, ?, ?)
      `).run('user_001', periodResult.lastInsertRowid, templateResult.lastInsertRowid, 'pending');
      
      console.log('✅ Assessment instance created with ID:', instanceResult.lastInsertRowid);
    } catch (error) {
      console.error('❌ Failed to create assessment instance:', error.message);
      
      // Let's check what's in the tables
      console.log('\n🔍 Checking table contents:');
      
      const users = connection.prepare('SELECT * FROM users').all();
      console.log('Users:', users);
      
      const types = connection.prepare('SELECT * FROM assessment_types').all();
      console.log('Assessment Types:', types);
      
      const periods = connection.prepare('SELECT * FROM assessment_periods').all();
      console.log('Assessment Periods:', periods);
      
      const templates = connection.prepare('SELECT * FROM assessment_templates').all();
      console.log('Assessment Templates:', templates);
    }
    
    connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugTestData(); 