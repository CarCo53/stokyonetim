const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const { jwtSecret, dbFile } = require('../config');
const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunlu.' });

    const db = new sqlite3.Database(dbFile);
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        db.close();
        if (err || !user) return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
        if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ message: 'Şifre hatalı.' });

        const payload = { id: user.id, store_id: user.store_id, username: user.username, role: user.role };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '2h' });
        res.json({ token, user: payload });
    });
});

module.exports = router;