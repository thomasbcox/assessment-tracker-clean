import { createSimpleTestDataBuilder } from '../src/lib/test-data-builder-simple';
import { db } from '../src/lib/db';

async function createDevData() {
  try {
    console.log('🗄️ Creating test data in development database...');
    
    const builder = createSimpleTestDataBuilder(db);
    
    // Create basic entities that work
    const result = await builder.create({
      user: { 
        email: 'john.doe@example.com', 
        role: 'manager',
        firstName: 'John',
        lastName: 'Doe'
      },
      assessmentType: { 
        name: 'Leadership Assessment',
        description: 'Comprehensive leadership evaluation',
        purpose: 'Identify leadership potential and development areas'
      },
      assessmentPeriod: { 
        name: 'Q1 2024', 
        isActive: 1,
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      },
      assessmentCategory: { 
        name: 'Communication Skills',
        description: 'Ability to communicate effectively',
        displayOrder: 1
      },
      assessmentTemplate: { 
        name: 'Leadership Template', 
        version: '1.0',
        description: 'Standard leadership assessment template'
      }
    });
    
    console.log('✅ Test data created successfully!');
    console.log('\n📊 Created Data Summary:');
    console.log('========================');
    
    if (result.user) {
      console.log(`👤 User: ${result.user.firstName} ${result.user.lastName} (${result.user.email}) - Role: ${result.user.role}`);
    }
    
    if (result.assessmentType) {
      console.log(`📋 Assessment Type: ${result.assessmentType.name} - ${result.assessmentType.description}`);
    }
    
    if (result.assessmentPeriod) {
      console.log(`📅 Period: ${result.assessmentPeriod.name} (${result.assessmentPeriod.startDate} to ${result.assessmentPeriod.endDate})`);
    }
    
    if (result.assessmentCategory) {
      console.log(`🏷️ Category: ${result.assessmentCategory.name} - ${result.assessmentCategory.description}`);
    }
    
    if (result.assessmentTemplate) {
      console.log(`📄 Template: ${result.assessmentTemplate.name} v${result.assessmentTemplate.version}`);
    }
    
    console.log('\n🔍 You can now inspect the data in your development database (dev.db)');
    console.log('💡 Use a SQLite browser or run: sqlite3 dev.db "SELECT * FROM users;"');
    
    // Show some sample queries
    console.log('\n📋 Sample queries to inspect the data:');
    console.log('sqlite3 dev.db "SELECT id, email, firstName, lastName, role FROM users;"');
    console.log('sqlite3 dev.db "SELECT id, name, description FROM assessment_types;"');
    console.log('sqlite3 dev.db "SELECT id, name, startDate, endDate FROM assessment_periods;"');
    console.log('sqlite3 dev.db "SELECT id, name, version FROM assessment_templates;"');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createDevData(); 