const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'pioadmin',
    password: 'Malinka314',
    database: 'pioemu'
});

module.exports = db;