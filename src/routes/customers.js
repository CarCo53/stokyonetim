const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const isValidTCKN = require('../utils/tckn');
const { dbFile } = require('../config');
const router = express.Router();

// Müşteri ekle (patron, çalışan, admin)
router.post('/', auth, role(['admin', 'patron', 'çalışan']), (req, res) => {
 console.log('GELEN BODY:', req.body); // <<< BU SATIRI EKLE
    const store_id = req.user.role === 'admin' ? req.body.store_id || req.user.store_id : req.user.store_id;
    const { name, surname, birthdate, tckn, consent_personal_data, email, address } = req.body;

    if (!name || !surname) {
        return res.status(400).json({ message: 'Ad ve soyad zorunludur.' });
    }
    if (typeof consent_personal_data === 'undefined' || ![0, 1, '0', '1', true, false].includes(consent_personal_data)) {
        return res.status(400).json({ message: 'KVKK rızası (consent_personal_data) zorunludur.' });
    }
    // KVKK rızası olmadan doğum tarihi ve tckn alınamaz
    if ((birthdate || tckn) && !(consent_personal_data == 1 || consent_personal_data === true || consent_personal_data === '1')) {
        return res.status(400).json({ message: 'KVKK rızası olmadan doğum tarihi veya TCKN girilemez.' });
    }
    // TCKN varsa algoritmik olarak doğrula
    if (tckn && !isValidTCKN(tckn)) {
        return res.status(400).json({ message: 'TCKN geçerli değil.' });
    }

    const db = new sqlite3.Database(dbFile);
    db.run(
        'INSERT INTO customers (store_id, name, surname, birthdate, tckn, consent_personal_data, email, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [store_id, name, surname, birthdate || null, tckn || null, Number(consent_personal_data), email || null, address || null],
        function (err) {
            if (err) {
                db.close();
                return res.status(500).json({ message: 'Müşteri eklenemedi.' });
            }
            const customer_id = this.lastID;
            // Rıza kaydı da loglanmalı
            db.run(
                'INSERT INTO consents (customer_id, consent_type, consent_value, ip_address, user_id) VALUES (?, ?, ?, ?, ?)',
                [
                    customer_id,
                    'kvkk',
                    Number(consent_personal_data),
                    req.ip,
                    req.user.id
                ],
                function (err2) {
                    db.close();
                    if (err2) return res.status(500).json({ message: 'Rıza loglanamadı.' });
                    res.json({ id: customer_id });
                }
            );
        }
    );
});

// Müşterileri listele (admin tümünü, diğerleri kendi mağazasını)
// (KVKK rızası olmayanların doğum tarihi ve tckn gösterilmez)
router.get('/', auth, (req, res) => {
    const db = new sqlite3.Database(dbFile);
    let query = 'SELECT * FROM customers';
    let params = [];
    if (req.user.role !== 'admin') {
        query += ' WHERE store_id = ?';
        params.push(req.user.store_id);
    }
    db.all(query, params, (err, rows) => {
        db.close();
        if (err) return res.status(500).json({ message: 'Listeleme hatası.' });
        // Kişisel veri rızası yoksa doğum tarihi ve tckn'yi gizle
        rows.forEach(r => {
            if (!r.consent_personal_data) {
                r.birthdate = null;
                r.tckn = null;
            }
        });
        res.json(rows);
    });
});

// Müşteri güncelle (admin, patron, çalışan)
router.put('/:id', auth, role(['admin', 'patron', 'çalışan']), (req, res) => {
    const { name, surname, birthdate, tckn, consent_personal_data, email, address } = req.body;
    const id = req.params.id;
    if (!name || !surname) {
        return res.status(400).json({ message: 'Ad ve soyad zorunludur.' });
    }
    if (typeof consent_personal_data === 'undefined' || ![0, 1, '0', '1', true, false].includes(consent_personal_data)) {
        return res.status(400).json({ message: 'KVKK rızası (consent_personal_data) zorunludur.' });
    }
    if ((birthdate || tckn) && !(consent_personal_data == 1 || consent_personal_data === true || consent_personal_data === '1')) {
        return res.status(400).json({ message: 'KVKK rızası olmadan doğum tarihi veya TCKN girilemez.' });
    }
    if (tckn && !isValidTCKN(tckn)) {
        return res.status(400).json({ message: 'TCKN geçerli değil.' });
    }

    const db = new sqlite3.Database(dbFile);
    db.get('SELECT * FROM customers WHERE id = ?', [id], (err, customer) => {
        if (err || !customer) {
            db.close();
            return res.status(404).json({ message: 'Müşteri bulunamadı.' });
        }
        // Admin dışındaki roller sadece kendi mağazasındaki müşteriyi güncelleyebilir.
        if (req.user.role !== 'admin' && customer.store_id !== req.user.store_id) {
            db.close();
            return res.status(403).json({ message: 'Yalnızca kendi mağazanızdaki müşterileri güncelleyebilirsiniz.' });
        }
        db.run(
            'UPDATE customers SET name=?, surname=?, birthdate=?, tckn=?, consent_personal_data=?, email=?, address=? WHERE id=?',
            [name, surname, birthdate || null, tckn || null, Number(consent_personal_data), email || null, address || null, id],
            function (err) {
                db.close();
                if (err) return res.status(500).json({ message: 'Müşteri güncellenemedi.' });
                if (this.changes === 0) return res.status(404).json({ message: 'Müşteri bulunamadı veya yetkiniz yok.' });
                res.json({ message: 'Güncellendi.' });
            }
        );
    });
});

// Müşteri sil (admin, patron, çalışan)
// Herkes sadece kendi mağazasındaki müşteriyi silebilir. Admin tüm müşterileri silebilir.
router.delete('/:id', auth, role(['admin', 'patron', 'çalışan']), (req, res) => {
    const id = req.params.id;
    const db = new sqlite3.Database(dbFile);
    db.get('SELECT * FROM customers WHERE id = ?', [id], (err, customer) => {
        if (err || !customer) {
            db.close();
            return res.status(404).json({ message: 'Müşteri bulunamadı.' });
        }
        if (req.user.role !== 'admin' && customer.store_id !== req.user.store_id) {
            db.close();
            return res.status(403).json({ message: 'Yalnızca kendi mağazanızdaki müşterileri silebilirsiniz.' });
        }
        db.run('DELETE FROM customers WHERE id = ?', [id], function (err) {
            db.close();
            if (err) return res.status(500).json({ message: 'Silme hatası.' });
            if (this.changes === 0) return res.status(404).json({ message: 'Müşteri bulunamadı veya yetkiniz yok.' });
            res.json({ message: 'Silindi.' });
        });
    });
});

module.exports = router;