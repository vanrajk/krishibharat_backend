const mysql = require('mysql');
const config = require('../config/config');

// Create a connection pool with your database configuration
const pool = mysql.createPool({
    connectionLimit: 50,   // Limit the number of connections
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    multipleStatements: true // Allow executing multiple statements
});

module.exports = pool;
