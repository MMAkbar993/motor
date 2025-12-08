import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  planType: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    required: true,
  },
  monthlyFee: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'active',
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'cash'],
  },
  lastPaymentDate: {
    type: Date,
  },
  nextPaymentDate: {
    type: Date,
  },
  stripeSubscriptionId: {
    type: String,
  },
  cancellationReason: {
    type: String,
  },
  cancelledAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
subscriptionSchema.index({ parkingLotId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ nextPaymentDate: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
