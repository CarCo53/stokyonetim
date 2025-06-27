const express = require('express');
const router = express.Router();
const db = require('../db');

// Firma ekleme (senin kodun, değişmedi)
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Firma adı zorunludur." });
  }
  try {
    await db.run("BEGIN");
    const result = await db.run(
      "INSERT INTO firms (name) VALUES (?)",
      [name]
    );
    const firmId = result.lastID;
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

// Firma listeleme (DÜZELTİLDİ)
router.get('/', (req, res) => {
  db.all("SELECT id, name FROM firms ORDER BY name ASC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Firmalar listelenemedi.", detail: err.message });
    }
    res.json(rows);
  });
});
module.exports = router;