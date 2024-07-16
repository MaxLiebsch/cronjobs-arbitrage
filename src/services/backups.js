const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

// Configuration
const MONGO_URI = 'mongodb://username:password@host:port/database';
const BACKUP_DIR = '/path/to/backup';
const LOG_FILE = '/path/to/logfile.log';
const RETENTION_DAYS = 7;

// Function to execute shell command
function executeCommand(command, callback) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      callback(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      callback(`Stderr: ${stderr}`);
      return;
    }
    callback(`Stdout: ${stdout}`);
  });
}

// Function to create backup
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, timestamp);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const command = `mongodump --uri="${MONGO_URI}" --out ${backupPath}`;
  executeCommand(command, (result) => {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${result}\n`);
    console.log(`Backup completed: ${backupPath}`);
  });
}

// Function to clean old backups
function cleanOldBackups() {
  const now = Date.now();
  const retentionPeriod = RETENTION_DAYS * 24 * 60 * 60 * 1000;

  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) throw err;

    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      fs.stat(filePath, (err, stat) => {
        if (err) throw err;

        if (now - stat.mtimeMs > retentionPeriod) {
          fs.rm(filePath, { recursive: true, force: true }, (err) => {
            if (err) throw err;
            fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] Deleted old backup: ${filePath}\n`);
            console.log(`Deleted old backup: ${filePath}`);
          });
        }
      });
    });
  });
}

// Schedule the backup task to run daily at 2 AM
cron.schedule('0 2 * * *', () => {
  createBackup();
  cleanOldBackups();
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] Scheduled backup completed\n`);
});

console.log('MongoDB backup scheduler started.');