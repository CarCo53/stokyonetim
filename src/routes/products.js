const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const isValidIMEI = require('../utils/imei');
const { dbFile } = require('../config');
const router = express.Router();

// Ürün ekle (patron, admin, çalışan)
router.post('/', auth, role(['admin', 'patron', 'çalışan']), (req, res) => {
    // Admin isterse farklı store_id gönderebilir, diğerleri sadece kendi mağazasına ekler
    const store_id = req.user.role === 'admin' ? (req.body.store_id || req.user.store_id) : req.user.store_id;
    const { name, barcode, category_id, stock, min_quantity, price, imei1, imei2 } = req.body;

    if (!name || !barcode || !category_id || typeof stock === 'undefined' || typeof min_quantity === 'undefined' || typeof price === 'undefined') {
        return res.status(400).json({ message: 'Tüm zorunlu alanları doldurun.' });
    }

    const db = new sqlite3.Database(dbFile);

    // Kategori requires_imei kontrolü
    db.get('SELECT * FROM categories WHERE id = ? AND store_id = ?', [category_id, store_id], (err, category) => {
        if (err || !category) {
            db.close();
            return res.status(400).json({ message: 'Kategori bulunamadı.' });
        }
        // IMEI kontrolü
        if (category.requires_imei == 1) {
            if (!imei1) {
                db.close();
                return res.status(400).json({ message: 'Bu kategoride IMEI 1 zorunludur.' });
            }
            if (!isValidIMEI(imei1)) {
                db.close();
                return res.status(400).json({ message: 'IMEI 1 geçerli değil.' });
            }
            if (imei2 && !isValidIMEI(imei2)) {
                db.close();
                return res.status(400).json({ message: 'IMEI 2 geçerli değil.' });
            }
        }
        db.run(
            'INSERT INTO products (store_id, name, barcode, category_id, stock, min_quantity, price, imei1, imei2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [store_id, name, barcode, category_id, stock, min_quantity, price, imei1 || null, imei2 || null],
            function (err) {
                db.close();
                if (err) {
                    let msg = 'Ürün eklenemedi.';
                    if (err.message && err.message.includes('UNIQUE constraint')) msg += ' IMEI zaten kayıtlı olabilir.';
                    return res.status(400).json({ message: msg });
                }
                res.json({ id: this.lastID });
            }
        );
    });
});

// Ürünleri listele (admin tümünü, diğerleri kendi mağazasını)
router.get('/', auth, (req, res) => {
    const db = new sqlite3.Database(dbFile);
    let query = 'SELECT * FROM products';
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

// Ürün güncelle (admin, patron, çalışan)
// Herkes SADECE kendi mağazasındaki ürünü güncelleyebilir. Admin tüm ürünleri.
router.put('/:id', auth, role(['admin', 'patron', 'çalışan']), (req, res) => {
    const { name, barcode, category_id, stock, min_quantity, price, imei1, imei2 } = req.body;
    const id = req.params.id;

    if (!name || !barcode || !category_id || typeof stock === 'undefined' || typeof min_quantity === 'undefined' || typeof price === 'undefined') {
        return res.status(400).json({ message: 'Tüm zorunlu alanları doldurun.' });
    }
    const db = new sqlite3.Database(dbFile);

    // Kategori requires_imei kontrolü
    // store_id kontrolü güncellemede ekstra select ile yapılır
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if (err || !product) {
            db.close();
            return res.status(404).json({ message: 'Ürün bulunamadı.' });
        }
        if (req.user.role !== 'admin' && product.store_id !== req.user.store_id) {
            db.close();
            return res.status(403).json({ message: 'Yalnızca kendi mağazanızdaki ürünleri güncelleyebilirsiniz.' });
        }

        db.get('SELECT * FROM categories WHERE id = ? AND store_id = ?', [category_id, product.store_id], (err, category) => {
            if (err || !category) {
                db.close();
                return res.status(400).json({ message: 'Kategori bulunamadı.' });
            }
            if (category.requires_imei == 1) {
                if (!imei1) {
                    db.close();
                    return res.status(400).json({ message: 'Bu kategoride IMEI 1 zorunludur.' });
                }
                if (!isValidIMEI(imei1)) {
                    db.close();
                    return res.status(400).json({ message: 'IMEI 1 geçerli değil.' });
                }
                if (imei2 && !isValidIMEI(imei2)) {
                    db.close();
                    return res.status(400).json({ message: 'IMEI 2 geçerli değil.' });
                }
            }
            db.run(
                'UPDATE products SET name=?, barcode=?, category_id=?, stock=?, min_quantity=?, price=?, imei1=?, imei2=? WHERE id=?',
                [name, barcode, category_id, stock, min_quantity, price, imei1 || null, imei2 || null, id],
                function (err) {
                    db.close();
                    if (err) {
                        let msg = 'Ürün güncellenemedi.';
                        if (err.message && err.message.includes('UNIQUE constraint')) msg += ' IMEI zaten kayıtlı olabilir.';
                        return res.status(400).json({ message: msg });
                    }
                    if (this.changes === 0) return res.status(404).json({ message: 'Ürün bulunamadı veya yetkiniz yok.' });
                    res.json({ message: 'Güncellendi.' });
                }
            );
        });
    });
});

// Ürün sil (admin, patron, çalışan)
// Herkes sadece kendi mağazasındaki ürünü silebilir. Admin tüm ürünleri silebilir.
router.delete('/:id', auth, role(['admin', 'patron', 'çalışan']), (req, res) => {
    const id = req.params.id;
    const db = new sqlite3.Database(dbFile);
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if (err || !product) {
            db.close();
            return res.status(404).json({ message: 'Ürün bulunamadı.' });
        }
        if (req.user.role !== 'admin' && product.store_id !== req.user.store_id) {
            db.close();
            return res.status(403).json({ message: 'Yalnızca kendi mağazanızdaki ürünleri silebilirsiniz.' });
        }
        db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
            db.close();
            if (err) return res.status(500).json({ message: 'Silme hatası.' });
            if (this.changes === 0) return res.status(404).json({ message: 'Ürün bulunamadı veya yetkiniz yok.' });
            res.json({ message: 'Silindi.' });
        });
    });
});

module.exports = router;