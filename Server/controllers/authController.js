const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'bc9e55fbfafe238874d194714507e02b0dd10f9c83a62dbc8b6d364cfe6d4944';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user.id);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    const isValid = await user.validPassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    const token = generateToken(user.id);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};