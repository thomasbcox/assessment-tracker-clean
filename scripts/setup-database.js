const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function setupDatabase() {
  try {
    console.log('🗄️ Setting up development database...');
    
    // Connect to the development database
    const dbPath = path.join(__dirname, '..', 'dev.db');
    const db = new Database(dbPath);
    
    // Temporarily disable foreign keys for cleanup
    db.pragma('foreign_keys = OFF');
    
    // Clear existing data (optional - comment out if you want to preserve data)
    console.log('🧹 Clearing existing data...');
    // Delete in order to respect foreign key constraints
    db.prepare('DELETE FROM assessment_responses').run();
    db.prepare('DELETE FROM assessment_instances').run();
    db.prepare('DELETE FROM assessment_questions').run();
    db.prepare('DELETE FROM assessment_categories').run();
    db.prepare('DELETE FROM assessment_templates').run();
    db.prepare('DELETE FROM assessment_types').run();
    db.prepare('DELETE FROM assessment_periods').run();
    db.prepare('DELETE FROM manager_relationships').run();
    db.prepare('DELETE FROM invitations').run();
    db.prepare('DELETE FROM magic_links').run();
    db.prepare('DELETE FROM users').run();
    
    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');
    
    console.log('👥 Creating essential users...');
    
    // Create the debug users that match the debug page
    const debugUsers = [
      {
        id: 'super1',
        email: 'super1@example.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: 1
      },
      {
        id: 'user-1753020245422-6u972rsmc',
        email: 'admin-1753020245422@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        isActive: 1
      },
      {
        id: 'user-1753020244364-fcetftc91',
        email: 'manager-1753020244364@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'manager',
        isActive: 1
      },
      {
        id: 'user-1753020245420-dfpa0gnh6',
        email: 'user-1753020245420@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: 1
      },
      {
        id: 'user-1753020245423-xrf9j3bmm',
        email: 'user-1753020245423@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: 1
      }
    ];
    
    // Insert debug users
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, first_name, last_name, role, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    debugUsers.forEach(user => {
      insertUser.run(user.id, user.email, user.firstName, user.lastName, user.role, user.isActive);
      console.log(`✅ Created ${user.role}: ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    // Create additional sample users for testing
    const sampleUsers = [
      { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe', role: 'manager' },
      { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', role: 'user' },
      { email: 'bob.johnson@example.com', firstName: 'Bob', lastName: 'Johnson', role: 'user' },
      { email: 'alice.brown@example.com', firstName: 'Alice', lastName: 'Brown', role: 'user' },
      { email: 'charlie.wilson@example.com', firstName: 'Charlie', lastName: 'Wilson', role: 'manager' },
      { email: 'david.miller@example.com', firstName: 'David', lastName: 'Miller', role: 'user' },
      { email: 'eva.garcia@example.com', firstName: 'Eva', lastName: 'Garcia', role: 'user' },
      { email: 'frank.taylor@example.com', firstName: 'Frank', lastName: 'Taylor', role: 'user' },
      { email: 'grace.anderson@example.com', firstName: 'Grace', lastName: 'Anderson', role: 'user' },
      { email: 'henry.thomas@example.com', firstName: 'Henry', lastName: 'Thomas', role: 'user' }
    ];
    
    sampleUsers.forEach(user => {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      insertUser.run(userId, user.email, user.firstName, user.lastName, user.role, 1);
      console.log(`✅ Created ${user.role}: ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    console.log('\n📋 Creating assessment types...');
    const assessmentTypes = [
      {
        name: 'Leadership Assessment',
        description: 'Comprehensive leadership evaluation',
        purpose: 'Identify leadership potential and development areas',
        isActive: 1
      },
      {
        name: 'Team Performance',
        description: 'Team collaboration and effectiveness assessment',
        purpose: 'Evaluate team dynamics and performance',
        isActive: 1
      },
      {
        name: 'Skills Assessment',
        description: 'Technical and soft skills evaluation',
        purpose: 'Assess current skill levels and identify gaps',
        isActive: 1
      }
    ];
    
    const insertType = db.prepare(`
      INSERT INTO assessment_types (name, description, purpose, is_active) 
      VALUES (?, ?, ?, ?)
    `);
    
    const typeIds = [];
    assessmentTypes.forEach(type => {
      const result = insertType.run(type.name, type.description, type.purpose, type.isActive);
      typeIds.push(result.lastInsertRowid);
      console.log(`✅ Created assessment type: ${type.name}`);
    });
    
    console.log('\n📅 Creating assessment periods...');
    const assessmentPeriods = [
      {
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        isActive: 0
      },
      {
        name: 'Q2 2024',
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        isActive: 0
      },
      {
        name: 'Q3 2024',
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        isActive: 0
      },
      {
        name: 'Q4 2024',
        startDate: '2024-10-01',
        endDate: '2024-12-31',
        isActive: 1
      }
    ];
    
    const insertPeriod = db.prepare(`
      INSERT INTO assessment_periods (name, start_date, end_date, is_active) 
      VALUES (?, ?, ?, ?)
    `);
    
    const periodIds = [];
    assessmentPeriods.forEach(period => {
      const result = insertPeriod.run(period.name, period.startDate, period.endDate, period.isActive);
      periodIds.push(result.lastInsertRowid);
      console.log(`✅ Created assessment period: ${period.name} (${period.isActive ? 'Active' : 'Inactive'})`);
    });
    
    console.log('\n📄 Creating assessment templates...');
    const insertTemplate = db.prepare(`
      INSERT INTO assessment_templates (assessment_type_id, name, version, description, is_active) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const templateIds = [];
    const templates = [
      { typeId: typeIds[0], name: 'Leadership Template', version: '1.0', description: 'Standard leadership assessment template' },
      { typeId: typeIds[1], name: 'Team Performance Template', version: '1.0', description: 'Team effectiveness evaluation template' },
      { typeId: typeIds[2], name: 'Skills Assessment Template', version: '1.0', description: 'Comprehensive skills evaluation template' }
    ];
    
    templates.forEach(template => {
      const result = insertTemplate.run(template.typeId, template.name, template.version, template.description, 1);
      templateIds.push(result.lastInsertRowid);
      console.log(`✅ Created template: ${template.name} v${template.version}`);
    });
    
    console.log('\n🏷️ Creating assessment categories...');
    const insertCategory = db.prepare(`
      INSERT INTO assessment_categories (assessment_type_id, name, description, display_order, is_active) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const categories = [
      { typeId: typeIds[0], name: 'Communication Skills', description: 'Ability to communicate effectively', order: 1 },
      { typeId: typeIds[0], name: 'Strategic Thinking', description: 'Strategic planning and decision making', order: 2 },
      { typeId: typeIds[0], name: 'Team Leadership', description: 'Leading and motivating teams', order: 3 },
      { typeId: typeIds[1], name: 'Collaboration', description: 'Working effectively with others', order: 1 },
      { typeId: typeIds[1], name: 'Problem Solving', description: 'Identifying and solving team issues', order: 2 },
      { typeId: typeIds[2], name: 'Technical Skills', description: 'Job-specific technical abilities', order: 1 },
      { typeId: typeIds[2], name: 'Soft Skills', description: 'Interpersonal and communication abilities', order: 2 }
    ];
    
    categories.forEach(category => {
      insertCategory.run(category.typeId, category.name, category.description, category.order, 1);
      console.log(`✅ Created category: ${category.name}`);
    });
    
    console.log('\n📝 Creating sample assessment questions...');
    const insertQuestion = db.prepare(`
      INSERT INTO assessment_questions (template_id, category_id, question_text, display_order, is_active) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // Get category IDs for the first template
    const categoryIds = db.prepare('SELECT id FROM assessment_categories WHERE assessment_type_id = ?').all(typeIds[0]);
    
    const questions = [
      { templateId: templateIds[0], categoryId: categoryIds[0].id, text: 'How effectively do you communicate with team members?', order: 1 },
      { templateId: templateIds[0], categoryId: categoryIds[0].id, text: 'Do you actively listen to others during discussions?', order: 2 },
      { templateId: templateIds[0], categoryId: categoryIds[1].id, text: 'How well do you think strategically about long-term goals?', order: 1 },
      { templateId: templateIds[0], categoryId: categoryIds[1].id, text: 'Do you consider multiple perspectives when making decisions?', order: 2 },
      { templateId: templateIds[0], categoryId: categoryIds[2].id, text: 'How effectively do you motivate your team?', order: 1 },
      { templateId: templateIds[0], categoryId: categoryIds[2].id, text: 'Do you provide constructive feedback to team members?', order: 2 }
    ];
    
    questions.forEach(question => {
      insertQuestion.run(question.templateId, question.categoryId, question.text, question.order, 1);
      console.log(`✅ Created question: ${question.text.substring(0, 50)}...`);
    });
    
    console.log('\n🔗 Creating manager relationships...');
    const insertRelationship = db.prepare(`
      INSERT INTO manager_relationships (manager_id, subordinate_id, period_id) 
      VALUES (?, ?, ?)
    `);
    
    // Create some manager-subordinate relationships for the active period
    const activePeriodId = db.prepare('SELECT id FROM assessment_periods WHERE is_active = 1 LIMIT 1').get().id;
    const relationships = [
      { managerId: 'user-1753020244364-fcetftc91', subordinateId: 'user-1753020245420-dfpa0gnh6' },
      { managerId: 'user-1753020244364-fcetftc91', subordinateId: 'user-1753020245423-xrf9j3bmm' }
    ];
    
    relationships.forEach(rel => {
      insertRelationship.run(rel.managerId, rel.subordinateId, activePeriodId);
      console.log(`✅ Created manager relationship: ${rel.managerId} → ${rel.subordinateId} (Period: ${activePeriodId})`);
    });
    
    console.log('\n✅ Database setup completed successfully!');
    
    // Show summary
    console.log('\n📊 Database Summary:');
    console.log('===================');
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const typeCount = db.prepare('SELECT COUNT(*) as count FROM assessment_types').get().count;
    const periodCount = db.prepare('SELECT COUNT(*) as count FROM assessment_periods').get().count;
    const templateCount = db.prepare('SELECT COUNT(*) as count FROM assessment_templates').get().count;
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM assessment_categories').get().count;
    const questionCount = db.prepare('SELECT COUNT(*) as count FROM assessment_questions').get().count;
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`📋 Assessment Types: ${typeCount}`);
    console.log(`📅 Assessment Periods: ${periodCount}`);
    console.log(`📄 Assessment Templates: ${templateCount}`);
    console.log(`🏷️ Assessment Categories: ${categoryCount}`);
    console.log(`❓ Assessment Questions: ${questionCount}`);
    
    console.log('\n🔑 Debug Users Available:');
    console.log('========================');
    debugUsers.forEach(user => {
      console.log(`• ${user.role}: ${user.email} (ID: ${user.id})`);
    });
    
    console.log('\n💡 Next Steps:');
    console.log('==============');
    console.log('1. Visit /debug to test different user roles');
    console.log('2. Visit /dashboard to see the main application');
    console.log('3. Visit /dashboard/admin to test admin features');
    console.log('4. Visit /dashboard/profile to test profile updates');
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 