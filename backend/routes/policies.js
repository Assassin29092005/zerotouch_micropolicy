const express = require('express');
const policyController = require('../controllers/policyController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const router = express.Router();

// All policy routes require authentication
router.use(authenticateToken);

// Policy validation middleware
const validatePolicyPurchase = [
  body('policyType')
    .isIn(['Rain Delay Cover', 'Flight Delay Cover', 'Traffic Jam Cover', 'Package Delay Cover'])
    .withMessage('Invalid policy type'),
  body('policyName').notEmpty().withMessage('Policy name is required'),
  body('price').isNumeric().isFloat({ min: 1 }).withMessage('Valid price is required')
];

// Policy routes
router.post('/purchase', validatePolicyPurchase, policyController.purchasePolicy);
router.get('/user', policyController.getUserPolicies);
router.get('/user/:policyId', policyController.getPolicyDetails);
router.put('/user/:policyId/cancel', policyController.cancelPolicy);
router.get('/notifications', policyController.getNotifications);

module.exports = router;
