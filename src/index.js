
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    project: 'KindredActs - Social Development Events Platform API',
    version: '1.0.0',
    documentation: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/social-login',
        'PUT /api/auth/profile'
      ],
      events: [
        'GET /api/events/recent',
        'GET /api/events/upcoming',
        'GET /api/events/:id',
        'POST /api/events',
        'GET /api/events/user/created',
        'PUT /api/events/:id',
        'DELETE /api/events/:id',
        'POST /api/events/:id/join',
        'GET /api/events/user/joined'
      ]
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    project: 'KindredActs API',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB before handling API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[Database Connection Error]', error);

    res.status(503).json({
      success: false,
      message: 'Database connection failed'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});


module.exports = app;
