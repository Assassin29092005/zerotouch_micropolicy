const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

exports.validateSignup = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  
  handleValidationErrors
];

exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password required'),
  
  handleValidationErrors
];

exports.validatePolicyPurchase = [
  body('policyType')
    .isIn(['Rain Delay Cover', 'Flight Delay Cover', 'Traffic Jam Cover', 'Package Delay Cover'])
    .withMessage('Invalid policy type'),
  
  body('policyName')
    .notEmpty()
    .isLength({ min: 5, max: 100 })
    .withMessage('Policy name must be 5-100 characters'),
  
  body('price')
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Price must be between ₹1 and ₹1000'),
  
  handleValidationErrors
];

exports.validateEventSimulation = [
  body('eventType')
    .isIn(['rain', 'flight', 'traffic', 'package', 'fake'])
    .withMessage('Invalid event type'),
  
  body('description')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be 10-500 characters'),
  
  handleValidationErrors
];
