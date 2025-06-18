const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, role: role || 'calisan' });
    res.status(201).json({ message: "User registered", user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: "Username already taken" });
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    next(err);
  }
};