const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        enum: ['rain', 'flight', 'traffic', 'package', 'fake']
    },
    description: {
        type: String,
        required: true
    },
    triggeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'cancelled'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
