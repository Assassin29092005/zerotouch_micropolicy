const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Policy = require('../models/Policy');
const Admin = require('../models/Admin');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');

// =========================
// ADMIN AUTHENTICATION ROUTES
// =========================

// Admin login route
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

        const { username, password } = req.body;

        // Find admin by username
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: admin._id, 
                username: admin.username,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        res.json({
            success: true,
            message: 'Admin login successful',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Admin signup route
router.post('/signup', [
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
        
        // Verify admin passkey
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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create new admin
        const admin = new Admin({
            username,
            email,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date(),
            isActive: true
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

// =========================
// EVENT SIMULATION ROUTES
// =========================

// Simulate event
router.post('/simulate-event', [
    adminAuthMiddleware,
    body('eventType').isIn(['rain', 'flight', 'traffic', 'package', 'fake']).withMessage('Invalid event type'),
    body('description').optional().isString()
], async (req, res) => {
    try {
        console.log('🔥 EVENT SIMULATION STARTED:', req.body);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { eventType, description } = req.body;
        const adminId = req.admin.userId;

        // Create event record
        const event = new Event({
            eventType,
            description: description || `Admin simulated ${eventType} event`,
            triggeredBy: adminId,
            status: 'active',
            createdAt: new Date()
        });

        await event.save();
        console.log('✅ Event saved:', event._id);

        // Find affected policies
        let policyTypeMapping = {
            'rain': 'Rain Delay Cover',
            'flight': 'Flight Delay Cover',
            'traffic': 'Traffic Jam Cover',
            'package': 'Package Delay Cover'
        };

        let affectedPolicies = [];
        let payoutAmount = 0;

        if (eventType !== 'fake') {
            const policyType = policyTypeMapping[eventType];
            console.log('🔍 Looking for policies of type:', policyType);
            
            affectedPolicies = await Policy.find({
                policyType: policyType,
                status: 'active'
            }).populate('userId', 'username email');

            console.log('📋 Found affected policies:', affectedPolicies.length);

            // Calculate payouts
            for (let policy of affectedPolicies) {
                payoutAmount += policy.price;
                
                // Update policy status
                policy.status = 'claimed';
                policy.claimDate = new Date();
                policy.claimAmount = policy.price;
                await policy.save();

                console.log(`💰 Payout triggered for policy ${policy._id}: $${policy.price}`);
            }
        }

        const response = {
            success: true,
            message: `${eventType} event simulated successfully! ${affectedPolicies.length} policies affected.`,
            event: {
                id: event._id,
                type: eventType,
                description: event.description,
                affectedPolicies: affectedPolicies.length,
                totalPayout: payoutAmount,
                createdAt: event.createdAt
            }
        };
        
        console.log('📤 Sending response:', response);
        res.json(response);

    } catch (error) {
        console.error('💥 Simulate event error:', error);
        res.status(500).json({
            success: false,
            message: 'Error simulating event: ' + error.message
        });
    }
});

// =========================
// DASHBOARD DATA
// =========================

// Get admin dashboard data
router.get('/dashboard', adminAuthMiddleware, async (req, res) => {
    try {
        // Get comprehensive dashboard stats
        const [
            totalUsers,
            totalActivePolicies,
            totalEvents,
            policyStats,
            recentUsers,
            recentEvents
        ] = await Promise.all([
            User.countDocuments(),
            Policy.countDocuments({ status: 'active' }),
            Event.countDocuments(),
            Policy.aggregate([
                { $match: { status: 'active' } },
                { 
                    $group: { 
                        _id: '$policyType',
                        count: { $sum: 1 },
                        totalValue: { $sum: '$price' }
                    }
                }
            ]),
            User.find().select('-password').sort({ createdAt: -1 }).limit(5),
            Event.find().populate('triggeredBy', 'username').sort({ createdAt: -1 }).limit(5)
        ]);

        const totalRevenue = policyStats.reduce((sum, stat) => sum + stat.totalValue, 0);

        res.json({
            success: true,
            dashboard: {
                summary: {
                    totalUsers,
                    totalActivePolicies,
                    totalEvents,
                    totalRevenue
                },
                policyStats,
                recentUsers,
                recentEvents
            }
        });

    } catch (error) {
        console.error('Get dashboard data error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data'
        });
    }
});

// Get all users
router.get('/users', adminAuthMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments();

        res.json({
            success: true,
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// Get event history
router.get('/events', adminAuthMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const events = await Event.find()
            .populate('triggeredBy', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalEvents = await Event.countDocuments();

        res.json({
            success: true,
            events,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalEvents / limit),
                totalEvents
            }
        });

    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching events'
        });
    }
});

module.exports = router;
