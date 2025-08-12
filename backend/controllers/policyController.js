const Policy = require('../models/Policy');
const User = require('../models/User');
const { generateBlockchainHash } = require('../utils/blockchain');

exports.purchasePolicy = async (req, res) => {
  try {
    const { policyType, policyName, price } = req.body;
    const userId = req.user.userId;

    console.log('💳 Policy purchase attempt:', { 
      userId, 
      policyType, 
      price 
    });

    // Validate policy data
    if (!policyType || !policyName || !price) {
      return res.status(400).json({
        success: false,
        message: 'Policy type, name, and price are required'
      });
    }

    // Generate blockchain hash
    const blockchainHash = generateBlockchainHash({
      userId,
      policyType,
      timestamp: Date.now()
    });

    // Create policy
    const policy = new Policy({
      userId,
      policyType,
      policyName,
      price,
      blockchainHash,
      metadata: {
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent']
      }
    });

    await policy.save();

    // Populate user data
    await policy.populate('userId', 'username email');

    console.log('✅ Policy purchased:', policy.policyName, 'by', policy.userId.username);

    res.status(201).json({
      success: true,
      message: 'Policy purchased successfully',
      policy
    });
  } catch (error) {
    console.error('❌ Policy purchase error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during policy purchase' 
    });
  }
};

exports.getUserPolicies = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, limit = 10, page = 1 } = req.query;

    // Build query
    const query = { userId };
    if (status) query.status = status;

    // Get policies with pagination
    const policies = await Policy.find(query)
      .sort({ purchaseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Policy.countDocuments(query);

    res.json({
      success: true,
      policies,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: {
        total,
        active: await Policy.countDocuments({ userId, status: 'active' }),
        paid: await Policy.countDocuments({ userId, status: 'paid' }),
        expired: await Policy.countDocuments({ userId, status: 'expired' })
      }
    });
  } catch (error) {
    console.error('❌ Get policies error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching policies' 
    });
  }
};

exports.getPolicyDetails = async (req, res) => {
  try {
    const { policyId } = req.params;
    const userId = req.user.userId;

    const policy = await Policy.findOne({ 
      _id: policyId, 
      userId 
    }).populate('userId', 'username email');

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    res.json({
      success: true,
      policy
    });
  } catch (error) {
    console.error('❌ Get policy details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching policy details'
    });
  }
};

exports.cancelPolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    const userId = req.user.userId;

    const policy = await Policy.findOne({ 
      _id: policyId, 
      userId,
      status: 'active' 
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Active policy not found'
      });
    }

    // Check if policy can be cancelled (within cancellation period)
    const timeSincePurchase = Date.now() - policy.purchaseDate.getTime();
    const cancellationPeriod = 30 * 60 * 1000; // 30 minutes

    if (timeSincePurchase > cancellationPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Policy cannot be cancelled after 30 minutes'
      });
    }

    policy.status = 'cancelled';
    await policy.save();

    res.json({
      success: true,
      message: 'Policy cancelled successfully',
      policy
    });
  } catch (error) {
    console.error('❌ Cancel policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling policy'
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get recently paid policies (last 24 hours)
    const recentPayouts = await Policy.find({
      userId,
      status: 'paid',
      paidAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ paidAt: -1 });

    const notifications = recentPayouts.map(policy => ({
      id: policy._id,
      type: 'payout',
      title: 'Payout Received!',
      message: `₹${policy.paidAmount || policy.price} for ${policy.policyName}`,
      description: policy.eventDescription || 'Event condition met',
      amount: policy.paidAmount || policy.price,
      timestamp: policy.paidAt,
      read: false
    }));

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching notifications' 
    });
  }
};
