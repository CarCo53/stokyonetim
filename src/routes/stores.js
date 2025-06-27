const express = require('express');
const router = express.Router();
const db = require('../db');

// Mağaza ekleme (Create)
router.post('/', async (req, res) => {
  const { name, firm_id } = req.body;
  if (!name || !firm_id) {
    return res.status(400).json({ error: "Mağaza adı ve firması zorunludur." });
  }
  try {
    const result = await db.run(
      "INSERT INTO stores (name, firm_id) VALUES (?, ?)",
      [name, firm_id]
    );
    res.json({ id: result.lastID, name, firm_id });
  } catch (err) {
    res.status(500).json({ error: "Mağaza eklenirken hata oluştu.", detail: err.message });
  }
});

// Mağazaları listeleme (Read all)
router.get('/', async (req, res) => {
  try {
    const stores = await db.all(`
      SELECT s.id, s.name, s.firm_id, f.name as firm_name
      FROM stores s
      LEFT JOIN firms f ON s.firm_id = f.id
      ORDER BY s.name ASC
    `);
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: "Mağazalar listelenemedi.", detail: err.message });
  }
});

// Tek mağaza detayı (Read single)
router.get('/:id', async (req, res) => {
  try {
    const store = await db.get(`
      SELECT s.id, s.name, s.firm_id, f.name as firm_name
      FROM stores s
      LEFT JOIN firms f ON s.firm_id = f.id
      WHERE s.id = ?
    `, [req.params.id]);
    if (!store) {
      return res.status(404).json({ error: "Mağaza bulunamadı." });
    }
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: "Mağaza getirilemedi.", detail: err.message });
  }
});

// Mağaza güncelleme (Update)
router.put('/:id', async (req, res) => {
  const { name, firm_id } = req.body;
  if (!name || !firm_id) {
    return res.status(400).json({ error: "Mağaza adı ve firması zorunludur." });
  }
  try {
    const result = await db.run(
      "UPDATE stores SET name = ?, firm_id = ? WHERE id = ?",
      [name, firm_id, req.params.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı." });
    }
    res.json({ id: req.params.id, name, firm_id });
  } catch (err) {
    res.status(500).json({ error: "Mağaza güncellenemedi.", detail: err.message });
  }
});

// Mağaza silme (Delete)
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run("DELETE FROM stores WHERE id = ?", [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı." });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Mağaza silinemedi.", detail: err.message });
  }
});

module.exports = router;