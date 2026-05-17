const { Sequelize, DataTypes } = require('sequelize'); // Исправлено
const sequelize = require('../config/db');

const DesignPreset = sequelize.define('DesignPreset', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  designSettings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: 'design_presets',
  timestamps: true
});

module.exports = DesignPreset;