const { Sequelize } = require('sequelize');

// .env dosyasından DB bilgilerini çek
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres', // veya sqlite
    logging: false
  }
);

module.exports = sequelize;