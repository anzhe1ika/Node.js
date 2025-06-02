const sql = require('mssql');

const config = {
  server: 'DESKTOP-63T21CU',
  database: 'SportsDB',
  user: 'sa',
  password: '123456789',
  options: {
    trustServerCertificate: true
  }
};

module.exports = {
  sql,
  config
};
