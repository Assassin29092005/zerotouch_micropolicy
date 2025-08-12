const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Policy = require('../models/Policy');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Create/Purchase new policy
router.post('/purchase', authMiddleware, [
    body('policyType').notEmpty().withMessage('Policy type is required'),
    body('price').isInt({ min: 1 }).withMessage('Price must be a positive integer'),
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

        const { policyType, price, description } = req.body;
        const userId = req.user.userId;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create new policy
        const policy = new Policy({
            userId,
            policyType,
            price: parseInt(price),
            description: description || `${policyType} policy`,
            status: 'active',
            purchaseDate: new Date()
        });

        await policy.save();

        res.status(201).json({
            success: true,
            message: 'Policy purchased successfully!',
            policy: {
                id: policy._id,
                type: policyType,
                price: policy.price,
                status: policy.status,
                purchaseDate: policy.purchaseDate
            }
        });

    } catch (error) {
        console.error('Policy purchase error:', error);
        res.status(500).json({
            success: false,
            message: 'Error purchasing policy: ' + error.message
        });
    }
});

// Get user's policies
router.get('/my-policies', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const policies = await Policy.find({ userId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            policies
        });

    } catch (error) {
        console.error('Get policies error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching policies'
        });
    }
});

// Get all available policy types
router.get('/types', async (req, res) => {
    try {
        const policyTypes = [
            {
                id: 1,
                name: 'Rain Delay Cover',
                price: 299,
                description: 'Get compensated when rain delays your outdoor plans',
                icon: '🌧️',
                category: 'weather'
            },
            {
                id: 2,
                name: 'Flight Delay Cover',
                price: 499,
                description: 'Coverage for flight delays and cancellations',
                icon: '✈️',
                category: 'travel'
            },
            {
                id: 3,
                name: 'Traffic Jam Cover',
                price: 199,
                description: 'Compensation for traffic-related delays',
                icon: '🚗',
                category: 'transport'
            },
            {
                id: 4,
                name: 'Package Delay Cover',
                price: 149,
                description: 'Protection against package delivery delays',
                icon: '📦',
                category: 'delivery'
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

module.exports = router;
