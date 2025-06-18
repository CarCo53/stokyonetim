const express = require('express');
const router = express.Router();
const { listConsents } = require('../controllers/consent.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Sadece admin/patron tüm rıza kayıtlarını görebilir
router.get('/', authenticateToken, authorizeRoles("admin", "patron"), listConsents);

module.exports = router;