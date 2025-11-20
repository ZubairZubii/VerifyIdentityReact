const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');

// Import routes
const apiRoutes = require('./routes/routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:5173/VerifyIdentityReact/',
    'http://127.0.0.1:5173/VerifyIdentityReact/'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// Use API routes
app.use('/api', apiRoutes);

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📧 Test email: http://localhost:${PORT}/api/test-email`);
  console.log(`📝 Form submission: http://localhost:${PORT}/api/submit-form`);
  console.log(`💳 Payment intent: http://localhost:${PORT}/api/create-payment-intent`);
  console.log(`📊 Admin submissions: http://localhost:${PORT}/api/admin/submissions`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});

