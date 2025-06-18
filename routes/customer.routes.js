const express = require('express');
const router = express.Router();
const { createCustomer } = require('../controllers/customer.controller');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createCustomer);

module.exports = router;