const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Minimal API server is running');
});

// Start server on a different port
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
}); 