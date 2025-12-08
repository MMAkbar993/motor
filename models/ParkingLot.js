import mongoose from 'mongoose';

const parkingLotSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  direccion: {
    type: String,
    trim: true,
  },
  telefono: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'suspended', 'cancelled', 'trial'],
    default: 'trial',
  },
  subscriptionPlan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic',
  },
  subscriptionStartDate: {
    type: Date,
  },
  subscriptionEndDate: {
    type: Date,
  },
  monthlyFee: {
    type: Number,
    default: 0,
  },
  maxMotorcycles: {
    type: Number,
    default: 50, // Basic plan default
  },
  currentMotorcycles: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  settings: {
    allowEmployees: {
      type: Boolean,
      default: false,
    },
    notificationEmail: {
      type: String,
    },
    autoRenewal: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

// Indexes
parkingLotSchema.index({ ownerId: 1 });
parkingLotSchema.index({ subscriptionStatus: 1 });
parkingLotSchema.index({ subscriptionEndDate: 1 });

const ParkingLot = mongoose.model('ParkingLot', parkingLotSchema);

export default ParkingLot;
