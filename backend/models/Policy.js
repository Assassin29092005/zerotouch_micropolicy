const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required']
  },
  policyType: { 
    type: String, 
    required: [true, 'Policy type is required'],
    enum: ['Rain Delay Cover', 'Flight Delay Cover', 'Traffic Jam Cover', 'Package Delay Cover']
  },
  policyName: { 
    type: String, 
    required: [true, 'Policy name is required']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [1, 'Price must be at least ₹1']
  },
  status: { 
    type: String, 
    enum: ['active', 'paid', 'expired', 'cancelled'],
    default: 'active' 
  },
  purchaseDate: { 
    type: Date, 
    default: Date.now 
  },
  expiryDate: {
    type: Date,
    default: function() {
      // Default expiry: 24 hours from purchase
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  blockchainHash: { 
    type: String, 
    required: [true, 'Blockchain hash is required']
  },
  paidAt: { 
    type: Date 
  },
  paidAmount: { 
    type: Number 
  },
  eventDescription: { 
    type: String 
  },
  metadata: {
    location: String,
    deviceInfo: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
policySchema.index({ userId: 1, status: 1 });
policySchema.index({ policyType: 1, status: 1 });
policySchema.index({ purchaseDate: -1 });
policySchema.index({ expiryDate: 1 });

// Virtual for policy duration
policySchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Auto-expire policies
policySchema.pre('find', function() {
  // Auto-update expired policies
  this.updateMany(
    { 
      status: 'active', 
      expiryDate: { $lt: new Date() } 
    },
    { 
      $set: { status: 'expired' } 
    }
  );
});

module.exports = mongoose.model('Policy', policySchema);
