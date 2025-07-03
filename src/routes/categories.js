const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { dbFile } = require('../config');
const router = express.Router();

// Kategori ekle (patron veya admin)
router.post('/', auth, role(['admin', 'patron']), (req, res) => {
    const store_id = req.user.role === 'admin' ? req.body.store_id || req.user.store_id : req.user.store_id;
    const { name, requires_imei } = req.body;

    if (!name || typeof requires_imei === 'undefined') {
        return res.status(400).json({ message: 'Kategori adı ve IMEI zorunludur.' });
    }
    if (![0, 1, '0', '1'].includes(requires_imei)) {
        return res.status(400).json({ message: 'IMEI 0 veya 1 olmalı.' });
    }

    const db = new sqlite3.Database(dbFile);
    db.run(
        'INSERT INTO categories (store_id, name, requires_imei) VALUES (?, ?, ?)',
        [store_id, name, Number(requires_imei)],
        function (err) {
            db.close();
            if (err) return res.status(500).json({ message: 'Kategori eklenemedi.' });
            res.json({ id: this.lastID });
        }
    );
});

// Kategorileri listele (patron/çalışan sadece kendi mağazasını, admin isterse tümünü)
router.get('/', auth, (req, res) => {
    const db = new sqlite3.Database(dbFile);
    let query = 'SELECT * FROM categories';
    let params = [];
    if (req.user.role !== 'admin') {
        query += ' WHERE store_id = ?';
        params.push(req.user.store_id);
    }
    db.all(query, params, (err, rows) => {
        db.close();
        if (err) return res.status(500).json({ message: 'Listeleme hatası.' });
        res.json(rows);
    });
});

// Kategori güncelle (patron sadece kendi mağazası, admin her mağazada)
router.put('/:id', auth, role(['admin', 'patron']), (req, res) => {
    const { name, requires_imei } = req.body;
    const id = req.params.id;
    if (!name || typeof requires_imei === 'undefined') {
        return res.status(400).json({ message: 'Kategori adı ve IMEI zorunludur.' });
    }
    if (![0, 1, '0', '1'].includes(requires_imei)) {
        return res.status(400).json({ message: 'IMEI 0 veya 1 olmalı.' });
    }

    const db = new sqlite3.Database(dbFile);
    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
        if (err || !category) {
            db.close();
            return res.status(404).json({ message: 'Kategori bulunamadı.' });
        }
        if (req.user.role === 'patron' && category.store_id !== req.user.store_id) {
            db.close();
            return res.status(403).json({ message: 'Yalnızca kendi mağazanızdaki kategorileri güncelleyebilirsiniz.' });
        }
        db.run(
            'UPDATE categories SET name = ?, requires_imei = ? WHERE id = ?',
            [name, Number(requires_imei), id],
            function (err2) {
                db.close();
                if (err2) return res.status(500).json({ message: 'Kategori güncellenemedi.' });
                if (this.changes === 0) return res.status(404).json({ message: 'Kategori bulunamadı veya yetkiniz yok.' });
                res.json({ message: 'Güncellendi.' });
            }
        );
    });
});

// Kategori sil (patron sadece kendi mağazası, admin her mağazada)
router.delete('/:id', auth, role(['admin', 'patron']), (req, res) => {
    const id = req.params.id;
    const db = new sqlite3.Database(dbFile);
    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
        if (err || !category) {
            db.close();
            return res.status(404).json({ message: 'Kategori bulunamadı.' });
        }
        if (req.user.role === 'patron' && category.store_id !== req.user.store_id) {
            db.close();
            return res.status(403).json({ message: 'Yalnızca kendi mağazanızdaki kategorileri silebilirsiniz.' });
        }
        db.run('DELETE FROM categories WHERE id = ?', [id], function (err2) {
            db.close();
            if (err2) return res.status(500).json({ message: 'Silme hatası.' });
            if (this.changes === 0) return res.status(404).json({ message: 'Kategori bulunamadı veya yetkiniz yok.' });
            res.json({ message: 'Silindi.' });
        });
    });
});

module.exports = router;