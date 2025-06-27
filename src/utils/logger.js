const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', '..', 'app.log');

function log(action, userId, storeId, details) {
    const entry = `[${new Date().toISOString()}] action=${action} userId=${userId} storeId=${storeId} details=${JSON.stringify(details)}\n`;
    fs.appendFile(logFile, entry, err => { if (err) console.error('Log yazılamadı:', err); });
}

module.exports = log;