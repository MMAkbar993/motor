import express from 'express';
import Payment from '../models/Payment.js';
import Motorcycle from '../models/Motorcycle.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { calculateExpirationDate } from '../utils/generateTicket.js';

const router = express.Router();

// Register payment
router.post('/motorcycles/:id/pago', authenticate, tenantIsolation, async (req, res) => {
  try {
    const { metodoPago, monto, notas } = req.body;
    const { id } = req.params;
    
    const motorcycle = await Motorcycle.findOne({
      _id: id,
      ...req.tenantFilter,
    });
    
    if (!motorcycle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Motorcycle not found' 
      });
    }
    
    // Find pending or overdue payment
    const payment = await Payment.findOne({
      motorcycleId: id,
      ...req.tenantFilter,
      estado: { $in: ['pendiente', 'atrasado'] },
    }).sort({ fechaVencimiento: -1 });
    
    if (!payment) {
      return res.status(400).json({ 
        success: false, 
        message: 'No pending payments found' 
      });
    }
    
    // Calculate days overdue if applicable
    const hoy = new Date();
    const diasAtraso = payment.fechaVencimiento < hoy
      ? Math.ceil((hoy - payment.fechaVencimiento) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Update payment
    payment.estado = 'pagado';
    payment.fechaPago = hoy;
    payment.metodoPago = metodoPago;
    payment.monto = monto || payment.monto;
    payment.diasAtraso = diasAtraso;
    if (notas) payment.notas = notas;
    await payment.save();
    
    // If monthly payment, create next payment
    if (payment.tipo === 'Mensual') {
      const proximaFechaVencimiento = calculateExpirationDate('Mensual');
      const nextPayment = new Payment({
        ...req.tenantFilter,
        motorcycleId: id,
        monto: payment.monto,
        tipo: 'Mensual',
        estado: 'pendiente',
        fechaVencimiento: proximaFechaVencimiento,
      });
      await nextPayment.save();
    }
    
    const updatedMotorcycle = await Motorcycle.findById(id)
      .populate('clienteId');
    
    res.json({
      success: true,
      payment,
      motorcycle: {
        ...updatedMotorcycle.toObject(),
        cliente: updatedMotorcycle.clienteId,
      },
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing payment', 
      error: error.message 
    });
  }
});

// Get payment summary
router.get('/resumen', authenticate, tenantIsolation, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);
    
    const pagosHoy = await Payment.find({
      ...req.tenantFilter,
      estado: 'pagado',
      fechaPago: { $gte: hoy, $lt: mañana },
    });
    
    const totalHoy = pagosHoy.reduce((sum, p) => sum + p.monto, 0);
    
    const pendientes = await Payment.countDocuments({
      ...req.tenantFilter,
      estado: { $in: ['pendiente', 'atrasado'] },
    });
    
    const atrasados = await Payment.countDocuments({
      ...req.tenantFilter,
      estado: 'atrasado',
    });
    
    res.json({
      success: true,
      totalHoy,
      cantidadPagosHoy: pagosHoy.length,
      pendientes,
      atrasados,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching payment summary', 
      error: error.message 
    });
  }
});

// Get all payments
router.get('/', authenticate, tenantIsolation, async (req, res) => {
  try {
    const { estado, tipo, motorcycleId } = req.query;
    
    const filter = { ...req.tenantFilter };
    if (estado) filter.estado = estado;
    if (tipo) filter.tipo = tipo;
    if (motorcycleId) filter.motorcycleId = motorcycleId;
    
    const payments = await Payment.find(filter)
      .populate({
        path: 'motorcycleId',
        populate: { path: 'clienteId' },
      })
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching payments', 
      error: error.message 
    });
  }
});

export default router;
