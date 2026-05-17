const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const presetRoutes = require('./routes/presets');
const exportRoutes = require('./routes/export');

const app = express();
 // JSON для больших canvasJSON
 app.use((req, res, next) => {
  // Берем адрес, с которого пришел запрос (твой фронтенд) и разрешаем именно его
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Разрешаем все методы и нужные заголовки
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // САМОЕ ВАЖНОЕ: Если браузер шлет проверочный запрос (OPTIONS), 
  // мы сразу говорим ему "200 OK" и обрываем проверку, пуская дальше.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});


app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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