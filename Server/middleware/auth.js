const jwt = require('jsonwebtoken');

// ТВОЙ КЛЮЧ УЖЕ ВСТАВЛЕН
const JWT_SECRET = 'bc9e55fbfafe238874d194714507e02b0dd10f9c83a62dbc8b6d364cfe6d4944';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Неверный формат токена' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Токен недействителен' });
  }
};