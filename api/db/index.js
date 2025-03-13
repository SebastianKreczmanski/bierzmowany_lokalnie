const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Try to load environment variables from different files
const envFiles = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../../.env.local')
];

let envLoaded = false;

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    try {
      require('dotenv').config({ path: envFile });
      console.log(`Environment variables loaded from ${envFile}`);
      envLoaded = true;
      break;
    } catch (error) {
      console.error(`Error loading ${envFile}:`, error.message);
    }
  }
}

if (!envLoaded) {
  console.warn('No environment file loaded. Using default values.');
}

// Konfiguracja puli połączeń
console.log('Creating database connection pool with configuration:');
console.log('Host:', process.env.DB_HOST || 's45.cyber-folks.pl');
console.log('User:', process.env.DB_USER || 'sebartk_bierzmowancy2025');
console.log('Database:', process.env.DB_NAME || 'sebartk_bierzmowancy');
console.log('Port:', process.env.DB_PORT || '3306');

// Use fallback values if environment variables are not available
const pool = mysql.createPool({
  host: process.env.DB_HOST || 's45.cyber-folks.pl',
  user: process.env.DB_USER || 'sebartk_bierzmowancy2025',
  password: process.env.DB_PASSWORD || 'bPfkrzRzz59MqeV!',
  database: process.env.DB_NAME || 'sebartk_bierzmowancy',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Asynchroniczne sprawdzenie połączenia z bazą danych
async function testConnection() {
  try {
    console.log('Testing database connection...');
    const connection = await pool.getConnection();
    console.log('Połączenie z bazą danych ustanowione pomyślnie!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Błąd połączenia z bazą danych:', error.message);
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    return false;
  }
}

// Wykonanie zapytania SQL
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Błąd zapytania SQL:', error.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Get a connection from the pool
async function getConnection() {
  return await pool.getConnection();
}

// Testujemy połączenie przy uruchomieniu
testConnection();

module.exports = {
  pool,
  query,
  getConnection
}; 