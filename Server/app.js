const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const presetRoutes = require('./routes/presets');
const exportRoutes = require('./routes/export');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // JSON для больших canvasJSON

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/presets', presetRoutes);
app.use('/api/export', exportRoutes);

// Заглушка для корня
app.get('/', (req, res) => {
  res.send('Newspaper Editor API');
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

module.exports = app;