const express = require('express');
const router = express.Router();
const { createCategory, updateCategory, listCategories } = require('../controllers/category.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Yalnızca admin/patron kategori ekleyebilir/güncelleyebilir
router.post('/', authenticateToken, authorizeRoles("admin", "patron"), createCategory);
router.put('/:id', authenticateToken, authorizeRoles("admin", "patron"), updateCategory);

// Herkes kendi mağazası için kategori listesini görebilir
router.get('/', authenticateToken, listCategories);

module.exports = router;