const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');

// Try to load environment variables from different files
const envFiles = [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env.local'),
  path.resolve(__dirname, '../.env.local')
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

console.log('Loaded environment variables:');
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- PORT:', process.env.PORT);
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');

// Initialize the database connection
const db = require('./db');

// Initialize express application
const app = express();

// Import routes (only importing routes that actually exist)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventsRoutes = require('./routes/events'); 
const locationsRoutes = require('./routes/locations');
const kandydatRoutes = require('./routes/kandydat');
const grupyRoutes = require('./routes/grupy');
const szkolyRoutes = require('./routes/szkoly');

// Configure middleware
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root endpoint for API health check
app.get('/', (req, res) => {
  res.send('API Bierzmowanie - Server is running correctly');
});

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/kandydat', kandydatRoutes);
app.use('/api/grupy', grupyRoutes);
app.use('/api/szkoly', szkolyRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Log detailed error information for debugging
  console.error('Error message:', err.message);
  if (err.stack) console.error('Error stack:', err.stack);
  if (err.code) console.error('Error code:', err.code);
  
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(error.name, error.message);
  console.error(error.stack);
  
  // Do not exit immediately, allow for graceful shutdown
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(error.name, error.message);
  console.error(error.stack);
  
  // Do not exit immediately, allow for graceful shutdown
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 