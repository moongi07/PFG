// configuramos la conexión
const mysql = require('mysql');
require('dotenv').config(); 

// creamos el pool de conexiones
const pool = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: 10, // puedes ajustar el número según lo necesites
});

// exportamos el pool
module.exports = pool;
