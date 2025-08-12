const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    policyType: {
        type: String,
        required: true,
        enum: ['Rain Delay Cover', 'Flight Delay Cover', 'Traffic Jam Cover', 'Package Delay Cover']
    },
    price: {
        type: Number,
        required: true,
        min: 1
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'claimed', 'cancelled'],
        default: 'active'
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    claimDate: {
        type: Date
    },
    claimAmount: {
        type: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Policy', policySchema);
