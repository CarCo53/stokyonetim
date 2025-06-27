const express = require('express');
const router = express.Router();
const db = require('../db');

// Firma ekleme
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Firma adı zorunludur." });
  }
  try {
    await db.run("BEGIN");
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

module.exports = router;