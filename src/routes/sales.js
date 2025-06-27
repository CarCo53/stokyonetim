const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { dbFile } = require('../config');
const router = express.Router();

// Satış ekle (patron, çalışan, admin)
router.post('/', auth, role(['admin', 'patron', 'çalışan']), (req, res) => {
    const store_id = req.user.role === 'admin' ? req.body.store_id || req.user.store_id : req.user.store_id;
    const user_id = req.user.id;
    const { customer_id, product_id, quantity } = req.body;

    if (!customer_id || !product_id || !quantity || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Tüm alanlar zorunlu ve miktar pozitif olmalıdır.' });
    }

    const db = new sqlite3.Database(dbFile);

    // Müşteri ve ürün mağaza kontrolü, stok kontrolü
    db.get('SELECT * FROM products WHERE id = ? AND store_id = ?', [product_id, store_id], (err, product) => {
        if (err || !product) {
            db.close();
            return res.status(404).json({ message: 'Ürün bulunamadı veya yetkiniz yok.' });
        }
        if (product.stock < quantity) {
            db.close();
            return res.status(400).json({ message: 'Yeterli stok yok.' });
        }
        db.get('SELECT * FROM customers WHERE id = ? AND store_id = ?', [customer_id, store_id], (err2, customer) => {
            if (err2 || !customer) {
                db.close();
                return res.status(404).json({ message: 'Müşteri bulunamadı veya yetkiniz yok.' });
            }
            // Satış kaydı ve stok güncellemesi transaction ile
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                db.run(
                    'INSERT INTO sales (store_id, user_id, customer_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?, ?, ?)',
                    [store_id, user_id, customer_id, product_id, quantity, product.price],
                    function (err3) {
                        if (err3) {
                            db.run('ROLLBACK');
                            db.close();
                            return res.status(500).json({ message: 'Satış kaydı başarısız.' });
                        }
                        db.run(
                            'UPDATE products SET stock = stock - ? WHERE id = ?',
                            [quantity, product_id],
                            function (err4) {
                                if (err4) {
                                    db.run('ROLLBACK');
                                    db.close();
                                    return res.status(500).json({ message: 'Stok güncellenemedi.' });
                                }
                                db.run('COMMIT');
                                db.close();
                                res.json({ id: this.lastID, message: 'Satış kaydedildi ve stok düşüldü.' });
                            }
                        );
                    }
                );
            });
        });
    });
});

// Satışları listele (admin tümünü, diğerleri kendi mağazasını)
router.get('/', auth, (req, res) => {
    const db = new sqlite3.Database(dbFile);
    let query = `
        SELECT s.*, p.name AS product_name, c.name AS customer_name, c.surname AS customer_surname, u.username AS user_name
        FROM sales s
        JOIN products p ON s.product_id = p.id
        JOIN customers c ON s.customer_id = c.id
        JOIN users u ON s.user_id = u.id
    `;
    let params = [];
    if (req.user.role !== 'admin') {
        query += ' WHERE s.store_id = ?';
        params.push(req.user.store_id);
    }
    db.all(query, params, (err, rows) => {
        db.close();
        if (err) return res.status(500).json({ message: 'Listeleme hatası.' });
        res.json(rows);
    });
});

// Satış güncelle (admin, patron, çalışan)
// Herkes SADECE kendi mağazasındaki satışı güncelleyebilir. Admin tüm satışları güncelleyebilir.
router.put('/:id', auth, role(['admin', 'patron', 'çalışan']), (req, res) => {
    const id = req.params.id;
    const { customer_id, product_id, quantity } = req.body;

    if (!customer_id || !product_id || !quantity || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Tüm alanlar zorunlu ve miktar pozitif olmalıdır.' });
    }

    const db = new sqlite3.Database(dbFile);

    // Satışı ve mevcut değerleri bul
    db.get('SELECT * FROM sales WHERE id = ?', [id], (err, sale) => {
        if (err || !sale) {
            db.close();
            return res.status(404).json({ message: 'Satış bulunamadı.' });
        }
        // Admin dışındaki roller sadece kendi mağazasındaki satışı güncelleyebilir
        if (req.user.role !== 'admin' && sale.store_id !== req.user.store_id) {
            db.close();
            return res.status(403).json({ message: 'Yalnızca kendi mağazanızdaki satışları güncelleyebilirsiniz.' });
        }

        // Yeni ürün ve müşteri mağaza kontrolü, stok ayarlama
        db.get('SELECT * FROM products WHERE id = ? AND store_id = ?', [product_id, sale.store_id], (err2, product) => {
            if (err2 || !product) {
                db.close();
                return res.status(404).json({ message: 'Ürün bulunamadı veya yetkiniz yok.' });
            }
            db.get('SELECT * FROM customers WHERE id = ? AND store_id = ?', [customer_id, sale.store_id], (err3, customer) => {
                if (err3 || !customer) {
                    db.close();
                    return res.status(404).json({ message: 'Müşteri bulunamadı veya yetkiniz yok.' });
                }
                // Stok kontrol: ürün değişmiş veya miktar değişmişse stok ayarla
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');
                    // Eski satış miktarını iade et
                    db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [sale.quantity, sale.product_id]);
                    // Yeni miktar için stok düş
                    db.get('SELECT stock FROM products WHERE id = ?', [product_id], (err4, row) => {
                        if (err4 || !row) {
                            db.run('ROLLBACK');
                            db.close();
                            return res.status(404).json({ message: 'Ürün bulunamadı.' });
                        }
                        if (row.stock < quantity) {
                            db.run('ROLLBACK');
                            db.close();
                            return res.status(400).json({ message: 'Yeterli stok yok.' });
                        }
                        db.run(
                            'UPDATE products SET stock = stock - ? WHERE id = ?',
                            [quantity, product_id],
                            function (err5) {
                                if (err5) {
                                    db.run('ROLLBACK');
                                    db.close();
                                    return res.status(500).json({ message: 'Stok güncellenemedi.' });
                                }
                                db.run(
                                    'UPDATE sales SET customer_id=?, product_id=?, quantity=?, price_at_sale=? WHERE id=?',
                                    [customer_id, product_id, quantity, product.price, id],
                                    function (err6) {
                                        if (err6) {
                                            db.run('ROLLBACK');
                                            db.close();
                                            return res.status(500).json({ message: 'Satış güncellenemedi.' });
                                        }
                                        db.run('COMMIT');
                                        db.close();
                                        res.json({ message: 'Satış güncellendi ve stoklar ayarlandı.' });
                                    }
                                );
                            }
                        );
                    });
                });
            });
        });
    });
});

// Satış sil (admin, patron, çalışan)
// Herkes sadece kendi mağazasındaki satışı silebilir. Admin tüm satışları silebilir.
router.delete('/:id', auth, role(['admin', 'patron', 'çalışan']), (req, res) => {
    const id = req.params.id;
    const db = new sqlite3.Database(dbFile);

    // Önce satış kaydını bul ve stok iadesi için gerekli miktarı ve ürünü bul
    db.get('SELECT * FROM sales WHERE id = ?', [id], (err, sale) => {
        if (err || !sale) {
            db.close();
            return res.status(404).json({ message: 'Satış bulunamadı.' });
        }
        // Admin dışındaki roller sadece kendi mağazasındaki satışı silebilir
        if (req.user.role !== 'admin' && sale.store_id !== req.user.store_id) {
            db.close();
            return res.status(403).json({ message: 'Yalnızca kendi mağazanızdaki satışları silebilirsiniz.' });
        }
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            db.run('DELETE FROM sales WHERE id = ?', [id], function (err2) {
                if (err2) {
                    db.run('ROLLBACK');
                    db.close();
                    return res.status(500).json({ message: 'Satış silinemedi.' });
                }
                db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [sale.quantity, sale.product_id], function (err3) {
                    if (err3) {
                        db.run('ROLLBACK');
                        db.close();
                        return res.status(500).json({ message: 'Stok iadesi yapılamadı.' });
                    }
                    db.run('COMMIT');
                    db.close();
                    res.json({ message: 'Satış silindi ve stok iade edildi.' });
                });
            });
        });
    });
});

module.exports = router;