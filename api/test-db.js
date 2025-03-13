require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('Database connection test starting...');
  console.log('Configuration:');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  console.log('Port:', process.env.DB_PORT);
  
  let connection;
  
  try {
    console.log('Attempting to create connection...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    
    console.log('Connection established successfully!');
    
    // Test a simple query
    console.log('Testing simple query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Query result:', rows);
    
    console.log('Database connection test completed successfully!');
    return true;
  } catch (error) {
    console.error('Database connection test failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    return false;
  } finally {
    if (connection) {
      console.log('Closing connection...');
      await connection.end();
      console.log('Connection closed.');
    }
  }
}

// Run the test
testDatabaseConnection()
  .then(success => {
    console.log('Test result:', success ? 'SUCCESS' : 'FAILURE');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 