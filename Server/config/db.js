const { Sequelize } = require('sequelize');
require('dotenv').config();

// Проверяем: если мы на Render, то у нас будет переменная DATABASE_URL.
// Если её нет (например, на локальном компе), используем старую добрую локальную строку подключения.
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/newspaper_db';

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false, // Чтобы SQL-запросы не спамили в консоль Render
  dialectOptions: {
    // Важнейшая настройка безопасности для облачных баз (Neon):
    // Если подключаемся к localhost — SSL не нужен. 
    // Если подключаемся к облаку — автоматически включаем шифрование SSL.
    ssl: dbUrl.includes('localhost') ? false : {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;