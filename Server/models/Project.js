const { Sequelize, DataTypes } = require('sequelize'); // Исправлен импорт для стабильной работы
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Без названия'
  },
  width: {
    type: DataTypes.INTEGER,
    defaultValue: 800
  },
  height: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  // Используем designSettings для синхронизации с фронтендом
  designSettings: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'projects',
  timestamps: true
});

module.exports = Project;