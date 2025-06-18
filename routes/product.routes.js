const express = require('express');
const router = express.Router();
const { createProduct, listProducts } = require('../controllers/product.controller');
const { authenticateToken } = require('../middleware/auth');

// Herkes ürün ekleyebilir (mağaza içi yetkilendirme istersen burada authorizeRoles ekleyebilirsin)
router.post('/', authenticateToken, createProduct);
router.get('/', authenticateToken, listProducts);

module.exports = router;