const { DataTypes } = require('sequelize');
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
    defaultValue: {
      fonts: {
        heading: 'Arial',
        body: 'Arial',
        headingSize: 32,
        bodySize: 16,
      },
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#0066cc',
        text: '#000000',
      },
      spacing: {
        padding: 16,
        margin: 12,
        lineHeight: 1.5,
      },
      layout: {
        columns: 2,
        alignment: 'left',
      }
    }
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = встроенный пресет
  }
}, {
  tableName: 'design_presets',
  timestamps: true
});

module.exports = DesignPreset;