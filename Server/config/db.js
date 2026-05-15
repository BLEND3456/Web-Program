const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('newspaper_db', 'postgres', '1234', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;