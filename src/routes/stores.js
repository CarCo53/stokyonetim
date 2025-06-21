const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { dbFile } = require('../config');
const router = express.Router();

// Mağaza ekle (admin)
router.post('/', auth, role(['admin']), (req, res) => {
    const { name, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Mağaza adı zorunlu.' });
    const db = new sqlite3.Database(dbFile);
    db.run('INSERT INTO stores (name, address) VALUES (?, ?)', [name, address || null], function (err) {
        db.close();
        if (err) return res.status(400).json({ message: 'Mağaza eklenemedi.' });
        res.json({ id: this.lastID });
    });
});

// Mağazaları listele (admin)
router.get('/', auth, role(['admin']), (req, res) => {
    const db = new sqlite3.Database(dbFile);
    db.all('SELECT * FROM stores', [], (err, rows) => {
        db.close();
        if (err) return res.status(500).json({ message: 'Listeleme hatası.' });
        res.json(rows);
    });
});

// Mağaza güncelle (sadece admin)
router.put('/:id', auth, role(['admin']), (req, res) => {
    const { name, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Mağaza adı zorunlu.' });
    const db = new sqlite3.Database(dbFile);
    db.run('UPDATE stores SET name = ?, address = ? WHERE id = ?', [name, address || null, req.params.id], function (err) {
        db.close();
        if (err) return res.status(400).json({ message: 'Mağaza güncellenemedi.' });
        if (this.changes === 0) return res.status(404).json({ message: 'Mağaza bulunamadı.' });
        res.json({ updated: this.changes });
    });
});

// Mağaza sil (sadece admin)
router.delete('/:id', auth, role(['admin']), (req, res) => {
    const db = new sqlite3.Database(dbFile);
    db.run('DELETE FROM stores WHERE id = ?', [req.params.id], function (err) {
        db.close();
        if (err) return res.status(400).json({ message: 'Mağaza silinemedi.' });
        if (this.changes === 0) return res.status(404).json({ message: 'Mağaza bulunamadı.' });
        res.json({ deleted: this.changes });
    });
});

module.exports = router;