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
// POLICY MANAGEMENT ROUTES (Protected)
// =========================

// Get policy statistics
router.get('/policy-stats', adminAuthMiddleware, async (req, res) => {
    try {
        // Get active policy counts by type
        const policyStats = await Policy.aggregate([
            { $match: { status: 'active' } },
            { 
                $group: { 
                    _id: '$policyType',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$price' }
                }
            }
        ]);

        // Get total users
        const totalUsers = await User.countDocuments();

        // Get total policies
        const totalPolicies = await Policy.countDocuments({ status: 'active' });

        // Get recent events
        const recentEvents = await Event.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('eventType description createdAt status');

        res.json({
            success: true,
            stats: policyStats,
            summary: {
                totalUsers,
                totalPolicies,
                totalValue: policyStats.reduce((sum, stat) => sum + stat.totalValue, 0)
            },
            recentEvents
        });

    } catch (error) {
        console.error('Policy stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching policy statistics'
        });
    }
});

// Get all policy types
router.get('/policy-types', adminAuthMiddleware, async (req, res) => {
    try {
        // In a real app, this would come from a PolicyType model
        // For now, return the available policy types
        const policyTypes = [
            {
                id: 1,
                name: 'Rain Delay Cover',
                price: 299,
                description: 'Get compensated when rain delays your outdoor plans',
                icon: '🌧️',
                category: 'weather',
                isActive: true
            },
            {
                id: 2,
                name: 'Flight Delay Cover',
                price: 499,
                description: 'Coverage for flight delays and cancellations',
                icon: '✈️',
                category: 'travel',
                isActive: true
            },
            {
                id: 3,
                name: 'Traffic Jam Cover',
                price: 199,
                description: 'Compensation for traffic-related delays',
                icon: '🚗',
                category: 'transport',
                isActive: true
            },
            {
                id: 4,
                name: 'Package Delay Cover',
                price: 149,
                description: 'Protection against package delivery delays',
                icon: '📦',
                category: 'delivery',
                isActive: true
            }
        ];

        res.json({
            success: true,
            policyTypes
        });

    } catch (error) {
        console.error('Get policy types error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching policy types'
        });
    }
});

// Create new policy type
router.post('/policy-types', [
    adminAuthMiddleware,
    body('name').notEmpty().withMessage('Policy name is required'),
    body('price').isInt({ min: 1 }).withMessage('Price must be a positive integer'),
    body('description').notEmpty().withMessage('Description is required'),
    body('icon').notEmpty().withMessage('Icon is required'),
    body('category').notEmpty().withMessage('Category is required')
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

        const { name, price, description, icon, category } = req.body;
        
        const newPolicyType = {
            id: Date.now(),
            name,
            price: parseInt(price),
            description,
            icon,
            category: category.toLowerCase(),
            isActive: true,
            createdAt: new Date(),
            createdBy: req.admin.userId
        };

        // In a real app, save to PolicyType collection
        // await PolicyType.create(newPolicyType);
        
        res.status(201).json({
            success: true,
            message: 'New policy type created successfully',
            policyType: newPolicyType
        });
        
    } catch (error) {
        console.error('Create policy type error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating policy type'
        });
    }
});

// Update policy type
router.put('/policy-types/:policyId', [
    adminAuthMiddleware,
    body('name').optional().notEmpty().withMessage('Policy name cannot be empty'),
    body('price').optional().isInt({ min: 1 }).withMessage('Price must be a positive integer'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty')
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

        const { policyId } = req.params;
        const updates = req.body;
        
        // In a real app, update PolicyType in database
        res.json({
            success: true,
            message: 'Policy type updated successfully',
            policyId,
            updates
        });
        
    } catch (error) {
        console.error('Update policy type error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating policy type'
        });
    }
});

// Delete/Deactivate policy type
router.delete('/policy-types/:policyId', adminAuthMiddleware, async (req, res) => {
    try {
        const { policyId } = req.params;
        
        // In a real app, soft delete by setting isActive to false
        // await PolicyType.findByIdAndUpdate(policyId, { isActive: false });
        
        res.json({
            success: true,
            message: 'Policy type deactivated successfully',
            policyId
        });
        
    } catch (error) {
        console.error('Delete policy type error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating policy type'
        });
    }
});

// =========================
// USER MANAGEMENT ROUTES
// =========================

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

// Get user policies
router.get('/users/:userId/policies', adminAuthMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        const policies = await Policy.find({ userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            policies
        });

    } catch (error) {
        console.error('Get user policies error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user policies'
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
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
            
            affectedPolicies = await Policy.find({
                policyType: policyType,
                status: 'active'
            }).populate('userId', 'username email');

            // Calculate payouts
            for (let policy of affectedPolicies) {
                payoutAmount += policy.price;
                
                // Update policy status
                policy.status = 'claimed';
                policy.claimDate = new Date();
                policy.claimAmount = policy.price;
                await policy.save();

                // In a real app, trigger payout process
                console.log(`Payout triggered for policy ${policy._id}: $${policy.price}`);
            }
        }

        res.json({
            success: true,
            message: `${eventType} event simulated successfully`,
            event: {
                id: event._id,
                type: eventType,
                description: event.description,
                affectedPolicies: affectedPolicies.length,
                totalPayout: payoutAmount,
                createdAt: event.createdAt
            }
        });

    } catch (error) {
        console.error('Simulate event error:', error);
        res.status(500).json({
            success: false,
            message: 'Error simulating event'
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

// =========================
// EXPORT ROUTES
// =========================

module.exports = router;
