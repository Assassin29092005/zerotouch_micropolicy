const Policy = require('../models/Policy');
const User = require('../models/User');
const Event = require('../models/Event');

exports.simulateEvent = async (req, res) => {
  try {
    const { eventType, description, payout } = req.body;
    
    console.log('🎭 Admin triggered event:', eventType);
    
    // Validate input
    if (!eventType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Event type and description are required'
      });
    }

    // Find matching policies based on event type
    let policyTypeToMatch;
    switch(eventType) {
      case 'rain':
        policyTypeToMatch = 'Rain Delay Cover';
        break;
      case 'flight':
        policyTypeToMatch = 'Flight Delay Cover';
        break;
      case 'traffic':
        policyTypeToMatch = 'Traffic Jam Cover';
        break;
      case 'package':
        policyTypeToMatch = 'Package Delay Cover';
        break;
      case 'fake':
        // For fake events, log but don't process any policies
        const fakeEvent = new Event({
          eventType: 'fake',
          description,
          triggeredBy: 'Admin',
          triggeredByUser: req.user.userId,
          isBlocked: true,
          usersAffected: 0,
          totalPayout: 0
        });
        await fakeEvent.save();
        
        return res.json({
          success: true,
          message: 'Fraud attempt blocked',
          affectedUsers: 0,
          totalPayout: 0,
          eventType: 'fraud_blocked',
          event: fakeEvent
        });
      default:
        return res.status(400).json({ 
          success: false,
          message: 'Invalid event type' 
        });
    }

    // Find all active policies of the matching type
    const matchingPolicies = await Policy.find({
      policyName: policyTypeToMatch,
      status: 'active'
    }).populate('userId', 'username email');

    console.log(`🔍 Found ${matchingPolicies.length} matching policies for ${policyTypeToMatch}`);

    if (matchingPolicies.length === 0) {
      // Still log the event even if no policies match
      const event = new Event({
        eventType,
        description,
        triggeredBy: 'Admin',
        triggeredByUser: req.user.userId,
        usersAffected: 0,
        totalPayout: 0,
        affectedPolicies: []
      });
      await event.save();

      return res.json({
        success: true,
        message: 'Event detected but no matching active policies found',
        affectedUsers: 0,
        totalPayout: 0,
        eventType: eventType,
        event
      });
    }

    // Update all matching policies to 'paid' status
    const policyIds = matchingPolicies.map(p => p._id);
    const updateResult = await Policy.updateMany(
      { _id: { $in: policyIds } },
      { 
        status: 'paid', 
        paidAt: new Date(),
        paidAmount: function() { return this.price; },
        eventDescription: description
      }
    );

    // Manual update for paidAmount (since function doesn't work in updateMany)
    for (let policy of matchingPolicies) {
      await Policy.findByIdAndUpdate(policy._id, {
        paidAmount: policy.price
      });
    }

    // Calculate total payout
    const totalPayout = matchingPolicies.reduce((sum, policy) => sum + policy.price, 0);
    const affectedUsers = matchingPolicies.length;

    console.log(`💰 Processed payouts: ₹${totalPayout} to ${affectedUsers} users`);

    // Create event record
    const event = new Event({
      eventType,
      description,
      triggeredBy: 'Admin',
      triggeredByUser: req.user.userId,
      affectedPolicies: policyIds,
      totalPayout,
      usersAffected: affectedUsers
    });
    await event.save();

    // Return details for admin
    const affectedUserDetails = matchingPolicies.map(policy => ({
      userId: policy.userId._id,
      username: policy.userId.username,
      email: policy.userId.email,
      policyName: policy.policyName,
      payout: policy.price,
      policyId: policy._id
    }));

    res.json({
      success: true,
      message: `Event processed successfully! ₹${totalPayout} paid to ${affectedUsers} customers`,
      affectedUsers: affectedUsers,
      totalPayout: totalPayout,
      eventType: eventType,
      userDetails: affectedUserDetails,
      event
    });

  } catch (error) {
    console.error('❌ Event simulation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during event simulation' 
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    // Build query
    let query = { role: 'customer' };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query, { password: 0 })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get user stats
    const userStats = await Promise.all(
      users.map(async (user) => {
        const policyStats = await Policy.aggregate([
          { $match: { userId: user._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$price' }
            }
          }
        ]);

        return {
          ...user.toObject(),
          stats: policyStats.reduce((acc, stat) => {
            acc[stat._id] = {
              count: stat.count,
              totalAmount: stat.totalAmount
            };
            return acc;
          }, {})
        };
      })
    );

    res.json({
      success: true,
      users: userStats,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
};

exports.getAllPolicies = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, policyType } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (policyType) query.policyType = policyType;

    const policies = await Policy.find(query)
      .populate('userId', 'username email')
      .sort({ purchaseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Policy.countDocuments(query);

    // Get overall stats
    const stats = await Policy.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$price' }
        }
      }
    ]);

    res.json({
      success: true,
      policies,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount
        };
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('❌ Get all policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching policies'
    });
  }
};

exports.getEventHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventType } = req.query;

    // Build query
    let query = {};
    if (eventType) query.eventType = eventType;

    const events = await Event.find(query)
      .populate('triggeredByUser', 'username')
      .populate('affectedPolicies')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      events,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Get event history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching event history'
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User stats
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const newUsersToday = await User.countDocuments({ 
      role: 'customer',
      createdAt: { $gte: last24h } 
    });

    // Policy stats
    const totalPolicies = await Policy.countDocuments();
    const activePolicies = await Policy.countDocuments({ status: 'active' });
    const paidPolicies = await Policy.countDocuments({ status: 'paid' });
    const newPoliciesToday = await Policy.countDocuments({
      purchaseDate: { $gte: last24h }
    });

    // Revenue stats
    const totalRevenue = await Policy.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    const paidRevenue = await Policy.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    // Event stats
    const totalEvents = await Event.countDocuments();
    const eventsToday = await Event.countDocuments({
      createdAt: { $gte: last24h }
    });
    const blockedEvents = await Event.countDocuments({ isBlocked: true });

    // Policy type breakdown
    const policyTypeStats = await Policy.aggregate([
      {
        $group: {
          _id: '$policyType',
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newToday: newUsersToday
        },
        policies: {
          total: totalPolicies,
          active: activePolicies,
          paid: paidPolicies,
          newToday: newPoliciesToday
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          paid: paidRevenue?.total || 0
        },
        events: {
          total: totalEvents,
          today: eventsToday,
          blocked: blockedEvents
        },
        policyTypes: policyTypeStats
      }
    });
  } catch (error) {
    console.error('❌ Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard stats'
    });
  }
};
