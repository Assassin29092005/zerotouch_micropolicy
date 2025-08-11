const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'https://your-frontend-url.onrender.com'],
    credentials: true
}));
app.use(express.json());

// Serve static files (for frontend)
app.use(express.static('.'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-username:your-password@cluster0.mongodb.net/zerotouch?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Policy Schema
const policySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policyType: { type: String, required: true },
  policyName: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, default: 'active' },
  purchaseDate: { type: Date, default: Date.now },
  blockchainHash: { type: String, required: true }
});

const Policy = mongoose.model('Policy', policySchema);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health Check
app.get('/', (req, res) => {
  res.json({ message: 'ZeroTouch Backend is running!', status: 'healthy' });
});

// User Registration
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log('📝 Signup attempt:', { username, email });

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();
    console.log('✅ User created:', user.email);

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('✅ Login successful:', user.email);

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Purchase Policy
app.post('/api/policies/purchase', authenticateToken, async (req, res) => {
  try {
    const { policyType, policyName, price } = req.body;
    
    const policy = new Policy({
      userId: req.user.userId,
      policyType,
      policyName,
      price,
      blockchainHash: '0x' + Math.random().toString(16).substr(2, 16)
    });

    await policy.save();
    console.log('✅ Policy purchased:', policy.policyName, 'by', req.user.username);

    res.status(201).json({
      message: 'Policy purchased successfully',
      policy
    });
  } catch (error) {
    console.error('❌ Policy purchase error:', error);
    res.status(500).json({ message: 'Server error during policy purchase' });
  }
});

// Get User Policies
app.get('/api/policies/user', authenticateToken, async (req, res) => {
  try {
    const policies = await Policy.find({ userId: req.user.userId });
    res.json(policies);
  } catch (error) {
    console.error('❌ Get policies error:', error);
    res.status(500).json({ message: 'Server error fetching policies' });
  }
});

// Get all users (for debugging - remove in production)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude passwords
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Catch all for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});

// Event Simulation Endpoint (Admin only)
app.post('/api/admin/simulate-event', async (req, res) => {
  try {
    const { eventType, description, payout } = req.body;
    
    console.log('🎭 Admin triggered event:', eventType);
    
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
      case 'fake':
        // For fake events, don't process any policies
        return res.json({
          message: 'Fraud attempt blocked',
          affectedUsers: 0,
          totalPayout: 0,
          eventType: 'fraud_blocked'
        });
      default:
        return res.status(400).json({ message: 'Invalid event type' });
    }

    // Find all active policies of the matching type
    const matchingPolicies = await Policy.find({
      policyName: policyTypeToMatch,
      status: 'active'
    }).populate('userId', 'username email');

    console.log(`🔍 Found ${matchingPolicies.length} matching policies for ${policyTypeToMatch}`);

    if (matchingPolicies.length === 0) {
      return res.json({
        message: 'Event detected but no matching active policies found',
        affectedUsers: 0,
        totalPayout: 0,
        eventType: eventType
      });
    }

    // Update all matching policies to 'paid' status
    const policyIds = matchingPolicies.map(p => p._id);
    await Policy.updateMany(
      { _id: { $in: policyIds } },
      { 
        status: 'paid', 
        paidAt: new Date(),
        paidAmount: matchingPolicies[0].price,
        eventDescription: description
      }
    );

    // Calculate total payout
    const totalPayout = matchingPolicies.reduce((sum, policy) => sum + policy.price, 0);
    const affectedUsers = matchingPolicies.length;

    console.log(`💰 Processed payouts: ₹${totalPayout} to ${affectedUsers} users`);

    // Return details for admin
    const affectedUserDetails = matchingPolicies.map(policy => ({
      username: policy.userId.username,
      email: policy.userId.email,
      policyName: policy.policyName,
      payout: policy.price
    }));

    res.json({
      message: `Event processed successfully! ₹${totalPayout} paid to ${affectedUsers} customers`,
      affectedUsers: affectedUsers,
      totalPayout: totalPayout,
      eventType: eventType,
      userDetails: affectedUserDetails
    });

  } catch (error) {
    console.error('❌ Event simulation error:', error);
    res.status(500).json({ message: 'Server error during event simulation' });
  }
});

// Get customer notifications (for real-time payout notifications)
app.get('/api/customer/notifications', authenticateToken, async (req, res) => {
  try {
    // Get recently paid policies for this user
    const recentPayouts = await Policy.find({
      userId: req.user.userId,
      status: 'paid',
      paidAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ paidAt: -1 });

    const notifications = recentPayouts.map(policy => ({
      id: policy._id,
      message: `Payout received! ₹${policy.paidAmount || policy.price} for ${policy.policyName}`,
      description: policy.eventDescription || 'Event condition met',
      amount: policy.paidAmount || policy.price,
      timestamp: policy.paidAt,
      type: 'payout'
    }));

    res.json(notifications);
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});
