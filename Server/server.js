const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app.js');
const sequelize = require('./config/db');
const { ensureProjectsPreviewUrlColumn } = require('./utils/ensureSchema');

// Обязательно импортируем модели для синхронизации
const User = require('./models/User');
const Project = require('./models/Project');
const DesignPreset = require('./models/DesignPreset');

// Устанавливаем связи (Associations)
User.hasMany(Project, { foreignKey: 'userId' });
Project.belongsTo(User, { foreignKey: 'userId' });

// Убедитесь, что здесь стоит именно тот порт, на который стучится фронтенд (4000)
const PORT = process.env.PORT || 4000;

sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL подключена успешно');
    const syncOptions = process.env.NODE_ENV === 'production' ? {} : { alter: true };
    return sequelize.sync(syncOptions);
  })
  .then(() => ensureProjectsPreviewUrlColumn())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен и слушает порт ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Критическая ошибка запуска сервера:', err);
  });