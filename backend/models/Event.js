const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventType: { 
    type: String, 
    required: [true, 'Event type is required'],
    enum: ['rain', 'flight', 'traffic', 'package', 'fake']
  },
  description: { 
    type: String, 
    required: [true, 'Event description is required']
  },
  triggeredBy: { 
    type: String, 
    default: 'System'
  },
  triggeredByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  affectedPolicies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Policy' 
  }],
  totalPayout: { 
    type: Number, 
    default: 0 
  },
  usersAffected: { 
    type: Number, 
    default: 0 
  },
  isBlocked: { 
    type: Boolean, 
    default: false 
  },
  dataSource: {
    api: String,
    response: mongoose.Schema.Types.Mixed,
    timestamp: Date
  },
  location: {
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ eventType: 1, createdAt: -1 });
eventSchema.index({ triggeredBy: 1 });
eventSchema.index({ isBlocked: 1 });

module.exports = mongoose.model('Event', eventSchema);
