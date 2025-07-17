const { createSimpleTestDataBuilder } = require('../src/lib/test-data-builder-simple');
const { db } = require('../src/lib/db');

async function createTestData() {
  try {
    console.log('🗄️ Creating test data in development database...');
    
    const builder = createSimpleTestDataBuilder(db);
    
    const result = await builder.create({
      user: { 
        email: 'test@example.com', 
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
      },
      assessmentInstance: { 
        status: 'pending'
      },
      assessmentQuestion: { 
        questionText: 'How do you handle conflict in the workplace?',
        displayOrder: 1
      },
      assessmentResponse: { 
        score: 8, 
        notes: 'Good conflict resolution skills demonstrated'
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
    
    if (result.assessmentInstance) {
      console.log(`📝 Instance: Status ${result.assessmentInstance.status}`);
    }
    
    if (result.assessmentQuestion) {
      console.log(`❓ Question: ${result.assessmentQuestion.questionText}`);
    }
    
    if (result.assessmentResponse) {
      console.log(`📊 Response: Score ${result.assessmentResponse.score} - ${result.assessmentResponse.notes}`);
    }
    
    console.log('\n🔍 You can now inspect the data in your development database (dev.db)');
    console.log('💡 Use a SQLite browser or run: sqlite3 dev.db "SELECT * FROM users;"');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestData(); 