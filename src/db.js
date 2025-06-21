const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '..', 'database.sqlite');
const migrationFile = path.join(__dirname, 'migrations/001_init.sql');
const seedFile = path.join(__dirname, 'migrations/seed.sql');

function runSqlFile(db, filePath) {
    const sql = fs.readFileSync(filePath, 'utf8');
    db.exec(sql, err => {
        if (err) {
            console.error(`Hata: ${filePath} uygulanamadı!`, err);
        } else {
            console.log(`${filePath} başarıyla uygulandı.`);
        }
        db.close();
    });
}

const cmd = process.argv[2];
if (cmd === 'migrate') {
    const db = new sqlite3.Database(dbFile);
    runSqlFile(db, migrationFile);
} else if (cmd === 'seed') {
    const db = new sqlite3.Database(dbFile);
    runSqlFile(db, seedFile);
} else {
    console.log('Kullanım: node src/db.js migrate|seed');
}