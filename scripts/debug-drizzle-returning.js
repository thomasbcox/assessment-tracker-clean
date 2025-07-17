const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');

async function debugDrizzleReturning() {
  try {
    console.log('🔍 Debugging Drizzle returning() method...');
    
    // Create in-memory test database
    const connection = new Database(':memory:');
    const db = drizzle(connection);
    
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
    
    // Import the Drizzle schema
    const { users, assessmentTypes, assessmentPeriods, assessmentTemplates, assessmentInstances } = require('../src/lib/db');
    
    // Step 1: Create a user and see what returning() returns
    console.log('\n👤 Step 1: Creating user...');
    const userData = {
      id: 'user_001',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: 1,
    };
    
    try {
      const [user] = await db.insert(users).values(userData).returning();
      console.log('✅ User created successfully');
      console.log('User object:', user);
      console.log('User.id:', user.id);
      console.log('User type:', typeof user.id);
    } catch (error) {
      console.error('❌ Failed to create user:', error.message);
      return;
    }
    
    // Step 2: Create an assessment type
    console.log('\n📋 Step 2: Creating assessment type...');
    const typeData = {
      name: 'Test Type',
      description: 'Test description',
      purpose: 'Test purpose',
      isActive: 1,
    };
    
    try {
      const [type] = await db.insert(assessmentTypes).values(typeData).returning();
      console.log('✅ Assessment type created successfully');
      console.log('Type object:', type);
      console.log('Type.id:', type.id);
      console.log('Type type:', typeof type.id);
    } catch (error) {
      console.error('❌ Failed to create assessment type:', error.message);
      return;
    }
    
    // Step 3: Create an assessment period
    console.log('\n📅 Step 3: Creating assessment period...');
    const periodData = {
      name: 'Test Period',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: 0,
    };
    
    try {
      const [period] = await db.insert(assessmentPeriods).values(periodData).returning();
      console.log('✅ Assessment period created successfully');
      console.log('Period object:', period);
      console.log('Period.id:', period.id);
      console.log('Period type:', typeof period.id);
    } catch (error) {
      console.error('❌ Failed to create assessment period:', error.message);
      return;
    }
    
    // Step 4: Create an assessment template
    console.log('\n📄 Step 4: Creating assessment template...');
    const templateData = {
      assessmentTypeId: type.id,
      name: 'Test Template',
      version: '1.0',
      description: 'Test template',
      isActive: 1,
    };
    
    try {
      const [template] = await db.insert(assessmentTemplates).values(templateData).returning();
      console.log('✅ Assessment template created successfully');
      console.log('Template object:', template);
      console.log('Template.id:', template.id);
      console.log('Template type:', typeof template.id);
    } catch (error) {
      console.error('❌ Failed to create assessment template:', error.message);
      return;
    }
    
    // Step 5: Create an assessment instance
    console.log('\n📝 Step 5: Creating assessment instance...');
    console.log('Using:');
    console.log('  - user.id:', user.id, '(type:', typeof user.id, ')');
    console.log('  - period.id:', period.id, '(type:', typeof period.id, ')');
    console.log('  - template.id:', template.id, '(type:', typeof template.id, ')');
    
    const instanceData = {
      userId: user.id,
      periodId: period.id,
      templateId: template.id,
      status: 'pending',
    };
    
    console.log('Instance data:', instanceData);
    
    try {
      const [instance] = await db.insert(assessmentInstances).values(instanceData).returning();
      console.log('✅ Assessment instance created successfully');
      console.log('Instance object:', instance);
    } catch (error) {
      console.error('❌ Failed to create assessment instance:', error.message);
      
      // Let's check what's in the tables
      console.log('\n🔍 Checking table contents:');
      
      const allUsers = await db.select().from(users);
      console.log('Users:', allUsers);
      
      const allTypes = await db.select().from(assessmentTypes);
      console.log('Assessment Types:', allTypes);
      
      const allPeriods = await db.select().from(assessmentPeriods);
      console.log('Assessment Periods:', allPeriods);
      
      const allTemplates = await db.select().from(assessmentTemplates);
      console.log('Assessment Templates:', allTemplates);
    }
    
    connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugDrizzleReturning(); 