const app = require('./app.js');
const sequelize = require('./config/db');

// Обязательно импортируем модели для синхронизации
const User = require('./models/User');
const Project = require('./models/Project');
const DesignPreset = require('./models/DesignPreset');

// Устанавливаем связи (Associations)
User.hasMany(Project, { foreignKey: 'userId' });
Project.belongsTo(User, { foreignKey: 'userId' });

// Убедитесь, что здесь стоит именно тот порт, на который стучится фронтенд (4000)
const PORT = 4000; 

sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL подключена успешно');
    // Используем force: true ТОЛЬКО ОДИН РАЗ, если таблицы не создаются. 
    // После успешного входа верните alter: true
    return sequelize.sync({ alter: true }); 
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен и слушает порт ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Критическая ошибка запуска сервера:', err);
  });