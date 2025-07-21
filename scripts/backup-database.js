const fs = require('fs');
const path = require('path');

function backupDatabase() {
  try {
    console.log('💾 Creating database backup...');
    
    const sourcePath = path.join(__dirname, '..', 'dev.db');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, '..', `dev-backup-${timestamp}.db`);
    
    // Check if source database exists
    if (!fs.existsSync(sourcePath)) {
      console.error('❌ Source database not found:', sourcePath);
      process.exit(1);
    }
    
    // Copy the database file
    fs.copyFileSync(sourcePath, backupPath);
    
    console.log('✅ Database backup created successfully!');
    console.log(`📁 Backup location: ${backupPath}`);
    
    // Show file size
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Backup size: ${fileSizeInMB} MB`);
    
    // List recent backups
    console.log('\n📋 Recent backups:');
    const backupDir = path.dirname(backupPath);
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('dev-backup-') && file.endsWith('.db'))
      .sort()
      .reverse()
      .slice(0, 5);
    
    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      const fileStats = fs.statSync(filePath);
      const size = (fileStats.size / (1024 * 1024)).toFixed(2);
      const date = fileStats.mtime.toLocaleDateString();
      console.log(`  • ${file} (${size} MB, ${date})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    process.exit(1);
  }
}

backupDatabase(); 