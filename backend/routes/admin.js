const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const { body } = require('express-validator');
const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);
// router.use(adminOnly); // Uncomment when you implement proper admin role checking

// Event simulation validation
const validateEventSimulation = [
  body('eventType')
    .isIn(['rain', 'flight', 'traffic', 'package', 'fake'])
    .withMessage('Invalid event type'),
  body('description').notEmpty().withMessage('Event description is required')
];

// Admin routes
router.post('/simulate-event', validateEventSimulation, adminController.simulateEvent);
router.get('/users', adminController.getAllUsers);
router.get('/policies', adminController.getAllPolicies);
router.get('/events', adminController.getEventHistory);
router.get('/dashboard/stats', adminController.getDashboardStats);

module.exports = router;
