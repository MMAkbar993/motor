import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
  },
  cedula: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  direccion: {
    type: String,
    trim: true,
  },
  notas: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes
clientSchema.index({ parkingLotId: 1, telefono: 1 });
clientSchema.index({ telefono: 1 });
clientSchema.index({ cedula: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;
