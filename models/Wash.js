import mongoose from 'mongoose';

const washSchema = new mongoose.Schema({
  motorcycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Motorcycle',
    required: true,
  },
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'completado'],
    default: 'pendiente',
  },
  cantidad: {
    type: Number,
    default: 0,
  },
  ultimoLavado: {
    type: Date,
  },
  costo: {
    type: Number,
    default: 0,
  },
  tipoLavado: {
    type: String,
    enum: ['basico', 'completo', 'detallado'],
    default: 'basico',
  },
  notas: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes
washSchema.index({ motorcycleId: 1 });
washSchema.index({ parkingLotId: 1 });
washSchema.index({ estado: 1 });

const Wash = mongoose.model('Wash', washSchema);

export default Wash;
