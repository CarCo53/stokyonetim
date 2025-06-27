const express = require('express');
const router = express.Router();
const db = require('../db');

// Firma ekleme
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Firma adı zorunludur." });
  }
  const trx = await db.run("BEGIN");
  try {
    // Firma ekle
    const result = await db.run(
      "INSERT INTO firms (name) VALUES (?)",
      [name]
    );
    const firmId = result.lastID;
    // O firmaya otomatik mağaza ekle (ör: "Merkez Mağaza")
    await db.run(
      "INSERT INTO stores (name, firm_id) VALUES (?, ?)",
      [`${name} Merkez Mağaza`, firmId]
    );
    await db.run("COMMIT");
    res.json({ id: firmId, name });
  } catch (err) {
    await db.run("ROLLBACK");
    res.status(500).json({ error: "Firma eklenirken bir hata oluştu.", detail: err.message });
  }
});

// Firma listeleme
router.get('/', async (req, res) => {
  try {
    const firms = await db.all("SELECT id, name FROM firms ORDER BY name ASC");
    res.json(firms);
  } catch (err) {
    res.status(500).json({ error: "Firmalar listelenemedi.", detail: err.message });
  }
});

// Firma silme (Delete)
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run("DELETE FROM firms WHERE id = ?", [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Firma bulunamadı." });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Firma silinemedi.", detail: err.message });
  }
});

// Firma güncelleme (Update)
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Firma adı zorunludur." });
  }
  try {
    const result = await db.run(
      "UPDATE firms SET name = ? WHERE id = ?",
      [name, req.params.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Firma bulunamadı." });
    }
    res.json({ id: req.params.id, name });
  } catch (err) {
    res.status(500).json({ error: "Firma güncellenemedi.", detail: err.message });
  }
});

module.exports = router;