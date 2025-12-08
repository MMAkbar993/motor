import mongoose from 'mongoose';

const motorcycleSchema = new mongoose.Schema({
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  placa: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  modelo: {
    type: String,
    required: true,
    trim: true,
  },
  marca: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  foto: {
    type: [String], // Array of photo URLs
    default: [],
  },
  fechaEntrada: {
    type: Date,
    required: true,
    default: Date.now,
  },
  fechaSalida: {
    type: Date,
  },
  estado: {
    type: String,
    enum: ['estacionada', 'retirada'],
    default: 'estacionada',
  },
  diasEstacionada: {
    type: Number,
    default: 0,
  },
  ticketNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  notas: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes (ticketNumber already has unique index from schema definition)
motorcycleSchema.index({ parkingLotId: 1, placa: 1 }, { unique: true });
motorcycleSchema.index({ parkingLotId: 1 });
motorcycleSchema.index({ placa: 1 });
motorcycleSchema.index({ estado: 1 });
motorcycleSchema.index({ fechaEntrada: 1 });

const Motorcycle = mongoose.model('Motorcycle', motorcycleSchema);

export default Motorcycle;
