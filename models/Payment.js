import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
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
  monto: {
    type: Number,
    required: true,
    min: 0,
  },
  tipo: {
    type: String,
    enum: ['Diario', 'Quincenal', 'Mensual'],
    required: true,
  },
  estado: {
    type: String,
    enum: ['pagado', 'pendiente', 'atrasado'],
    default: 'pendiente',
  },
  fechaPago: {
    type: Date,
  },
  fechaVencimiento: {
    type: Date,
    required: true,
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia', 'qr', 'otros'],
  },
  diasAtraso: {
    type: Number,
    default: 0,
  },
  notas: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes
paymentSchema.index({ motorcycleId: 1 });
paymentSchema.index({ parkingLotId: 1 });
paymentSchema.index({ estado: 1 });
paymentSchema.index({ fechaVencimiento: 1 });
paymentSchema.index({ parkingLotId: 1, estado: 1, fechaVencimiento: 1 });

// Auto-update estado to 'atrasado' if fechaVencimiento passed
paymentSchema.pre('save', function(next) {
  if (this.estado === 'pendiente' && this.fechaVencimiento < new Date()) {
    const daysDiff = Math.ceil((new Date() - this.fechaVencimiento) / (1000 * 60 * 60 * 24));
    this.estado = 'atrasado';
    this.diasAtraso = daysDiff;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
