require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,

  supportBigNumbers: true,
  decimalNumbers: true, // 关键配置项
  bigNumberStrings: false
});

module.exports = pool;