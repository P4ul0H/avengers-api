const mysql = require('mysql');
require('dotenv').config();

const conn = mysql.createConnection({
    host: 'localhost',
    user: process.env.db_user,
    password: process.env.db_pass,
    database: process.env.db_name
});

conn.connect((err) => {
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
});

module.exports = conn;