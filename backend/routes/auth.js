const express = require('express');
const authController = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const { body, validationResult } = require('express-validator');


// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
// Admin signup route with passkey
router.post('/admin/signup', [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('passkey')
        .notEmpty()
        .withMessage('Admin passkey required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, email, password, passkey } = req.body;
        
        // Verify admin passkey (set this in your .env)
        const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY || 'ZeroTouch2024!';
        
        if (passkey !== ADMIN_PASSKEY) {
            return res.status(403).json({
                success: false,
                message: 'Invalid admin passkey'
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            $or: [{ email }, { username }]
        });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email or username already exists'
            });
        }

        // Hash password and create admin
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const admin = new Admin({
            username,
            email,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date()
        });

        await admin.save();
        
        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Admin signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during admin signup'
        });
    }
});


// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;
