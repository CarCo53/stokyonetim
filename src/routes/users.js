const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const auth = require('../middlewares/auth');
const { dbFile } = require('../config');
const router = express.Router();

// Kullanıcı ekle (admin veya patron)
router.post('/', auth, (req, res) => {
    const { store_id, username, password, role: userRole } = req.body;
    if (!store_id || !username || !password || !userRole) {
        return res.status(400).json({ message: 'Tüm alanlar zorunlu.' });
    }

    // ADMIN İSE: Her türlü ekleyebilir
    if (req.user.role === 'admin') {
        // devam...
    }
    // PATRON İSE: Sadece kendi mağazasına ve sadece çalışan ekleyebilir
    else if (req.user.role === 'patron') {
        if (userRole !== 'calisan') {
            return res.status(403).json({ message: 'Patron sadece çalışan ekleyebilir.' });
        }
        if (parseInt(store_id) !== req.user.store_id) {
            return res.status(403).json({ message: 'Patron sadece kendi mağazasına çalışan ekleyebilir.' });
        }
        // devam...
    }
    // Diğer her durumda engelle
    else {
        return res.status(403).json({ message: 'Yetkiniz yok.' });
    }

    const db = new sqlite3.Database(dbFile);

    // Aynı kullanıcı adı var mı kontrolü
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            db.close();
            return res.status(500).json({ message: 'Veritabanı hatası.' });
        }
        if (row) {
            db.close();
            return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });
        }

        const hash = bcrypt.hashSync(password, 10);
        db.run(
            'INSERT INTO users (store_id, username, password_hash, role) VALUES (?, ?, ?, ?)',
            [store_id, username, hash, userRole],
            function (err) {
                db.close();
                if (err) return res.status(400).json({ message: 'Kullanıcı eklenemedi.' });
                res.json({ id: this.lastID });
            }
        );
    });
});

// Kullanıcıları listele (admin veya patron)
router.get('/', auth, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'patron') {
        return res.status(403).json({ message: 'Yetkiniz yok.' });
    }
    const db = new sqlite3.Database(dbFile);
    let query = req.user.role === 'admin' ? 'SELECT * FROM users' : 'SELECT * FROM users WHERE store_id = ?';
    let params = req.user.role === 'admin' ? [] : [req.user.store_id];
    db.all(query, params, (err, rows) => {
        db.close();
        if (err) return res.status(500).json({ message: 'Listeleme hatası.' });
        res.json(rows);
    });
});

// Kullanıcıyı güncelle (admin her şeyi güncelleyebilir)
router.put('/:id', auth, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Sadece admin kullanıcı güncelleyebilir.' });
    }
    const { store_id, username, password, role: userRole } = req.body;
    if (!store_id || !username || !userRole) {
        return res.status(400).json({ message: 'Gerekli alanlar eksik.' });
    }
    const db = new sqlite3.Database(dbFile);

    // Aynı kullanıcı adını kullanan başka biri var mı (kendisi hariç)
    db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.params.id], (err, row) => {
        if (err) {
            db.close();
            return res.status(500).json({ message: 'Veritabanı hatası.' });
        }
        if (row) {
            db.close();
            return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });
        }

        let sql, params;
        if (password) {
            const hash = bcrypt.hashSync(password, 10);
            sql = 'UPDATE users SET store_id = ?, username = ?, password_hash = ?, role = ? WHERE id = ?';
            params = [store_id, username, hash, userRole, req.params.id];
        } else {
            sql = 'UPDATE users SET store_id = ?, username = ?, role = ? WHERE id = ?';
            params = [store_id, username, userRole, req.params.id];
        }

        db.run(sql, params, function (err) {
            db.close();
            if (err) return res.status(400).json({ message: 'Kullanıcı güncellenemedi.' });
            res.json({ updated: this.changes });
        });
    });
});

// Kullanıcı sil (admin her kullanıcıyı silebilir)
router.delete('/:id', auth, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Sadece admin kullanıcı silebilir.' });
    }
    const db = new sqlite3.Database(dbFile);
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
        db.close();
        if (err) return res.status(400).json({ message: 'Kullanıcı silinemedi.' });
        res.json({ deleted: this.changes });
    });
});

module.exports = router;