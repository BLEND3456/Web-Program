const app = require('./app.js');
const sequelize = require('./config/db');

// Импортируем все модели
const User = require('./models/User');
const Project = require('./models/Project');
const DesignPreset = require('./models/DesignPreset');

// ИСПРАВЛЕНО: Берем порт из .env, если его нет — используем 4001 (чтобы избежать конфликта с 4000)
const PORT = process.env.PORT || 4000;

sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL подключена');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Ошибка подключения к БД:', err);
  });