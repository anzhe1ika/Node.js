


const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'SportsDB',
  user: 'lab4user',
  password: '12345',
  options: {
    trustServerCertificate: true
  }
};

module.exports = {
  sql,
  config
};
