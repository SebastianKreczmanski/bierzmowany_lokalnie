const express = require('express');
const cors = require('cors');
const path = require('path');

// Try to load environment variables
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
  console.log('Environment variables loaded from .env file');
  
  console.log('Loaded environment variables:');
  console.log('- DB_HOST:', process.env.DB_HOST);
  console.log('- DB_USER:', process.env.DB_USER);
  console.log('- DB_NAME:', process.env.DB_NAME);
  console.log('- PORT:', process.env.PORT);
  console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');
} catch (error) {
  console.error('Error loading .env file:', error.message);
}

// Initialize express application
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint for API health check
app.get('/', (req, res) => {
  res.send('API Bierzmowanie - Server is running correctly');
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 