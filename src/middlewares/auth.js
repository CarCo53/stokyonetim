const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'supersecretdevkey';

module.exports = function (req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Giriş yapmalısınız.' });
    try {
        req.user = jwt.verify(auth.split(' ')[1], secret);
        next();
    } catch {
        return res.status(401).json({ message: 'Geçersiz oturum.' });
    }
};