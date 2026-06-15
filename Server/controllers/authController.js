const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../config/jwt');

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Пароль должен быть не менее 8 символов' });
    }

    // Ищем, занят ли email ИЛИ логин (name)
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ email }, { name }]
      }
    });

    if (existing) {
      return res.status(409).json({ message: 'Логин или email уже занят' });
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

exports.resetPassword = async (req, res) => {
  try {
    const { name, email, newPassword } = req.body;

    if (!name || !email || !newPassword) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }

    // Ищем пользователя, у которого совпадает И логин, И email
    const user = await User.findOne({ where: { name, email } });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь с таким логином и email не найден' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Новый пароль должен быть не менее 8 символов' });
    }

    // Хэшируем новый пароль
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save(); // Сохраняем в базу

    res.json({ message: 'Пароль успешно изменен!' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const trimmed = typeof name === 'string' ? name.trim() : '';

    if (!trimmed) {
      return res.status(400).json({ message: 'Имя пользователя обязательно' });
    }
    if (trimmed.length < 2) {
      return res.status(400).json({ message: 'Имя должно быть не менее 2 символов' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (trimmed !== user.name) {
      const existing = await User.findOne({ where: { name: trimmed } });
      if (existing) {
        return res.status(409).json({ message: 'Это имя уже занято' });
      }
      user.name = trimmed;
      await user.save();
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Пароль должен быть не менее 8 символов' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Пароли не совпадают' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Пароль успешно изменён' });
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