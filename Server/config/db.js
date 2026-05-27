const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL must be set in environment variables');
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
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
