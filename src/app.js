const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { port } = require('./config');
const rateLimit = require('./middlewares/rateLimit');
const errorHandler = require('./middlewares/errorHandler');
const authenticateJWT = require('./middlewares/auth');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/firms', require('./routes/firms'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/consents', require('./routes/consents'));
app.use('/api/sales', require('./routes/sales'));


// /api/me endpointi ekle
app.get('/api/me', authenticateJWT, (req, res) => {
    res.json({ user: req.user });
});

// Test paneli için static servis
app.use('/test-panel', express.static('test-panel'));

app.use(errorHandler);

// SADECE BİR KEZ!
app.listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor...`);
});