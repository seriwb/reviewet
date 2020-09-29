import mysql from 'mysql2/promise';

const options: {} = process.env.MYSQL_URI
  ? {
    uri: process.env.MYSQL_URI,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }
  : {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    password: process.env.MYSQL_PASSWORD,
    db: 'reviewet',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

export const mysqlClient = mysql.createPool(options);