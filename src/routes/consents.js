const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { dbFile } = require('../config');
const router = express.Router();

// Rıza kaydı ekle (patron, çalışan, admin)
router.post('/', auth, role(['admin', 'patron', 'çalışan']), (req, res) => {
    const { customer_id, consent_type, consent_value } = req.body;
    if (!customer_id || !consent_type || typeof consent_value === 'undefined') {
        return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
    }

    const db = new sqlite3.Database(dbFile);

    // Sadece kendi mağazasının müşterisine rıza loglayabilir (admin hariç)
    db.get('SELECT * FROM customers WHERE id = ?', [customer_id], (err, customer) => {
        if (err || !customer) {
            db.close();
            return res.status(404).json({ message: 'Müşteri bulunamadı.' });
        }
        if (req.user.role !== 'admin' && customer.store_id !== req.user.store_id) {
            db.close();
            return res.status(403).json({ message: 'Bu müşteriye rıza loglama yetkiniz yok.' });
        }
        db.run(
            'INSERT INTO consents (customer_id, consent_type, consent_value, ip_address, user_id) VALUES (?, ?, ?, ?, ?)',
            [
                customer_id,
                consent_type,
                Number(consent_value),
                req.ip,
                req.user.id
            ],
            function (err2) {
                db.close();
                if (err2) return res.status(500).json({ message: 'Rıza loglanamadı.' });
                res.json({ id: this.lastID });
            }
        );
    });
});

// Rıza kayıtlarını listele (admin tümünü, diğerleri kendi mağazasının müşterileri için)
router.get('/', auth, (req, res) => {
    const db = new sqlite3.Database(dbFile);
    let query = `
        SELECT consents.*, c.name, c.surname, c.store_id
        FROM consents
        JOIN customers c ON consents.customer_id = c.id
    `;
    let params = [];
    if (req.user.role !== 'admin') {
        query += ' WHERE c.store_id = ?';
        params.push(req.user.store_id);
    }
    db.all(query, params, (err, rows) => {
        db.close();
        if (err) return res.status(500).json({ message: 'Listeleme hatası.' });
        res.json(rows);
    });
});

// Belirli bir müşteri için rıza kayıtlarını listele
router.get('/customer/:customer_id', auth, (req, res) => {
    const customer_id = req.params.customer_id;
    const db = new sqlite3.Database(dbFile);

    db.get('SELECT * FROM customers WHERE id = ?', [customer_id], (err, customer) => {
        if (err || !customer) {
            db.close();
            return res.status(404).json({ message: 'Müşteri bulunamadı.' });
        }
        if (req.user.role !== 'admin' && customer.store_id !== req.user.store_id) {
            db.close();
            return res.status(403).json({ message: 'Bu müşterinin rızalarına erişim yetkiniz yok.' });
        }
        db.all('SELECT * FROM consents WHERE customer_id = ?', [customer_id], (err2, rows) => {
            db.close();
            if (err2) return res.status(500).json({ message: 'Listeleme hatası.' });
            res.json(rows);
        });
    });
});

// Rıza kaydını sil (sadece admin)
router.delete('/:id', auth, role(['admin']), (req, res) => {
    const id = req.params.id;
    const db = new sqlite3.Database(dbFile);
    db.run('DELETE FROM consents WHERE id = ?', [id], function (err) {
        db.close();
        if (err) return res.status(500).json({ message: 'Silme hatası.' });
        if (this.changes === 0) return res.status(404).json({ message: 'Rıza kaydı bulunamadı.' });
        res.json({ message: 'Silindi.' });
    });
});

module.exports = router;