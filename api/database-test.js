// Simple script to test database connection
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('🔍 Database Connection Test');
console.log('=========================');

// Log connection parameters (masking password)
console.log('Connection parameters:');
console.log('- Host:', process.env.DB_HOST);
console.log('- User:', process.env.DB_USER);
console.log('- Database:', process.env.DB_NAME);
console.log('- Port:', process.env.DB_PORT);
console.log('- Password: [HIDDEN]');

async function testConnection() {
  console.log('\nAttempting connection to MySQL...');
  
  // Create connection pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    connectTimeout: 10000
  });
  
  try {
    // Test the connection
    console.log('Getting connection from pool...');
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to the database!');
    
    // Run a simple query
    console.log('Testing query execution...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query executed successfully. Result:', rows);
    
    connection.release();
    console.log('Connection released back to pool.');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error sqlState:', error.sqlState);
    
    return false;
  } finally {
    // Close the pool
    await pool.end();
    console.log('Connection pool closed.');
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Database connection test completed successfully!');
      console.log('Your database configuration is correct.');
    } else {
      console.log('\n❌ Database connection test failed.');
      console.log('Please check your connection parameters and network access.');
    }
  })
  .catch(err => {
    console.error('Unexpected error during test:', err);
  }); 