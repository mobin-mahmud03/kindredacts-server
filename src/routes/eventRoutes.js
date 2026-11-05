const express = require('express');
const router = express.Router();
const {
  getRecentEvents,
  getUpcomingEvents,
  getEventById,
  createEvent,
  getUserCreatedEvents,
  updateEvent,
  deleteEvent,
  joinEvent,
  getUserJoinedEvents
} = require('../controllers/eventsController');
const { verifyJWT } = require('../middleware/auth');

// Public routes
router.get('/recent', getRecentEvents); // 6 recent upcoming events (.limit(6))
router.get('/upcoming', getUpcomingEvents); // All upcoming events (past events filtered out)
router.get('/:id', getEventById); // View event details (public view)

// Protected routes (Requires valid JWT)
router.post('/', verifyJWT, createEvent); // Create event
router.get('/user/created', verifyJWT, getUserCreatedEvents); // Manage Events page
router.put('/:id', verifyJWT, updateEvent); // Update event (owner only)
router.delete('/:id', verifyJWT, deleteEvent); // Delete event (owner only)
router.post('/:id/join', verifyJWT, joinEvent); // Join event (requires login)
router.get('/user/joined', verifyJWT, getUserJoinedEvents); // Joined Events page (sorted by eventDate)

module.exports = router;
