const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./db');
const { seedData } = require('./seed');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: true, 
  credentials: true
}));
app.use(express.json());


app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    project: 'KindredActs - Social Development Events Platform API',
    version: '1.0.0',
    documentation: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/social-login', 'PUT /api/auth/profile'],
      events: ['GET /api/events/recent', 'GET /api/events/upcoming', 'GET /api/events/:id', 'POST /api/events', 'GET /api/events/user/created', 'PUT /api/events/:id', 'DELETE /api/events/:id', 'POST /api/events/:id/join', 'GET /api/events/user/joined']
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});


app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);


app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});


async function startServer() {
  await connectDB();
  await seedData();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` KindredActs API Server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

startServer();

module.exports = app;
export default app;