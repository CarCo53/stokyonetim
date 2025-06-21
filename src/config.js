require('dotenv').config();
module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'supersecretdevkey',
    port: process.env.PORT || 3001,
    dbFile: 'database.sqlite'
};