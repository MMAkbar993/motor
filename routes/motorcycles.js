import express from 'express';
import Motorcycle from '../models/Motorcycle.js';
import Client from '../models/Client.js';
import Payment from '../models/Payment.js';
import Wash from '../models/Wash.js';
import ParkingLot from '../models/ParkingLot.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { generateTicketNumber, calculateExpirationDate } from '../utils/generateTicket.js';

const router = express.Router();

// Get all motorcycles (with filters)
router.get('/', authenticate, tenantIsolation, async (req, res) => {
  try {
    const { search, estado, estadoPago, estadoLavado } = req.query;
    
    const filter = { ...req.tenantFilter };
    
    if (estado) {
      filter.estado = estado;
    }
    
    if (search) {
      filter.$or = [
        { placa: { $regex: search, $options: 'i' } },
        { modelo: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } },
        { marca: { $regex: search, $options: 'i' } },
      ];
    }
    
    let motorcycles = await Motorcycle.find(filter)
      .populate('clienteId', 'nombre telefono cedula email')
      .sort({ fechaEntrada: -1 });
    
    // Filter by payment status if needed
    if (estadoPago) {
      const payments = await Payment.find({
        ...req.tenantFilter,
        estado: estadoPago,
      });
      const motorcycleIds = payments.map(p => p.motorcycleId.toString());
      motorcycles = motorcycles.filter(m => 
        motorcycleIds.includes(m._id.toString())
      );
    }
    
    // Filter by wash status if needed
    if (estadoLavado) {
      const washes = await Wash.find({
        ...req.tenantFilter,
        estado: estadoLavado,
      });
      const motorcycleIds = washes.map(w => w.motorcycleId.toString());
      motorcycles = motorcycles.filter(m => 
        motorcycleIds.includes(m._id.toString())
      );
    }
    
    // Enrich with payment and wash info
    const enriched = await Promise.all(
      motorcycles.map(async (moto) => {
        const [pago, lavado] = await Promise.all([
          Payment.findOne({
            motorcycleId: moto._id,
            estado: { $in: ['pendiente', 'atrasado'] },
          }).sort({ fechaVencimiento: -1 }),
          Wash.findOne({ motorcycleId: moto._id }),
        ]);
        
        return {
          ...moto.toObject(),
          cliente: moto.clienteId,
          pago: pago || null,
          lavado: lavado || null,
        };
      })
    );
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching motorcycles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching motorcycles', 
      error: error.message 
    });
  }
});

// Get single motorcycle
router.get('/:id', authenticate, tenantIsolation, async (req, res) => {
  try {
    const motorcycle = await Motorcycle.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
    })
      .populate('clienteId')
      .populate('parkingLotId');
    
    if (!motorcycle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Motorcycle not found' 
      });
    }
    
    const [pago, lavado] = await Promise.all([
      Payment.find({ motorcycleId: motorcycle._id }).sort({ createdAt: -1 }),
      Wash.findOne({ motorcycleId: motorcycle._id }),
    ]);
    
    res.json({
      ...motorcycle.toObject(),
      cliente: motorcycle.clienteId,
      pagos: pago,
      lavado: lavado || null,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching motorcycle', 
      error: error.message 
    });
  }
});

// Create new motorcycle
router.post('/', authenticate, tenantIsolation, async (req, res) => {
  try {
    const {
      placa,
      modelo,
      marca,
      color,
      cliente,
      tipoPago,
      monto,
      lavados,
      lugar,
      fotos,
    } = req.body;
    
    if (!placa || !modelo || !marca || !cliente || !tipoPago) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Check parking lot limits
    const parkingLot = await ParkingLot.findById(req.parkingLotId);
    if (!parkingLot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parking lot not found' 
      });
    }
    
    const currentCount = await Motorcycle.countDocuments({
      ...req.tenantFilter,
      estado: 'estacionada',
    });
    
    if (currentCount >= parkingLot.maxMotorcycles) {
      return res.status(403).json({
        success: false,
        message: 'Motorcycle limit reached. Please upgrade your plan.',
      });
    }
    
    // Find or create client
    let client = await Client.findOne({
      ...req.tenantFilter,
      telefono: cliente.telefono,
    });
    
    if (!client) {
      client = new Client({
        ...req.tenantFilter,
        nombre: cliente.nombreCompleto || cliente.nombre,
        telefono: cliente.telefono,
        cedula: cliente.cedula,
        email: cliente.email,
      });
      await client.save();
    }
    
    // Generate ticket number
    const ticketNumber = generateTicketNumber(req.parkingLotId);
    
    // Create motorcycle
    const motorcycle = new Motorcycle({
      ...req.tenantFilter,
      placa: placa.toUpperCase(),
      modelo,
      marca,
      color,
      clienteId: client._id,
      foto: fotos || [],
      ticketNumber,
    });
    
    await motorcycle.save();
    
    // Calculate expiration date
    const fechaVencimiento = calculateExpirationDate(tipoPago);
    
    // Create payment record
    const payment = new Payment({
      ...req.tenantFilter,
      motorcycleId: motorcycle._id,
      monto: monto || 0,
      tipo: tipoPago,
      estado: 'pendiente',
      fechaVencimiento,
    });
    
    await payment.save();
    
    // Create wash record if needed
    if (lavados && lavados !== 'No') {
      const wash = new Wash({
        ...req.tenantFilter,
        motorcycleId: motorcycle._id,
        estado: 'pendiente',
        cantidad: 0,
      });
      await wash.save();
    }
    
    // Update parking lot count
    parkingLot.currentMotorcycles = currentCount + 1;
    await parkingLot.save();
    
    const populatedMotorcycle = await Motorcycle.findById(motorcycle._id)
      .populate('clienteId');
    
    res.status(201).json({
      success: true,
      motorcycle: {
        ...populatedMotorcycle.toObject(),
        cliente: populatedMotorcycle.clienteId,
        pago: payment,
        ticketNumber,
      },
    });
  } catch (error) {
    console.error('Error creating motorcycle:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Motorcycle with this plate already exists',
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error creating motorcycle', 
      error: error.message 
    });
  }
});

// Update motorcycle
router.put('/:id', authenticate, tenantIsolation, async (req, res) => {
  try {
    const motorcycle = await Motorcycle.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true, runValidators: true }
    ).populate('clienteId');
    
    if (!motorcycle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Motorcycle not found' 
      });
    }
    
    res.json({
      success: true,
      motorcycle: {
        ...motorcycle.toObject(),
        cliente: motorcycle.clienteId,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating motorcycle', 
      error: error.message 
    });
  }
});

// Register exit (salida)
router.put('/:id/salida', authenticate, tenantIsolation, async (req, res) => {
  try {
    const motorcycle = await Motorcycle.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      estado: 'estacionada',
    });
    
    if (!motorcycle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Motorcycle not found or already removed' 
      });
    }
    
    // Check for pending payments
    const pendingPayments = await Payment.find({
      motorcycleId: motorcycle._id,
      estado: { $in: ['pendiente', 'atrasado'] },
    });
    
    if (pendingPayments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove motorcycle with pending payments',
        pendingPayments: pendingPayments.map(p => ({
          monto: p.monto,
          tipo: p.tipo,
          diasAtraso: p.diasAtraso,
        })),
      });
    }
    
    // Calculate days parked
    const fechaEntrada = new Date(motorcycle.fechaEntrada);
    const fechaSalida = new Date();
    const diasEstacionada = Math.ceil(
      (fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24)
    );
    
    motorcycle.estado = 'retirada';
    motorcycle.fechaSalida = fechaSalida;
    motorcycle.diasEstacionada = diasEstacionada;
    await motorcycle.save();
    
    // Update parking lot count
    const parkingLot = await ParkingLot.findById(req.parkingLotId);
    if (parkingLot) {
      parkingLot.currentMotorcycles = Math.max(0, parkingLot.currentMotorcycles - 1);
      await parkingLot.save();
    }
    
    res.json({
      success: true,
      motorcycle: {
        ...motorcycle.toObject(),
        diasEstacionada,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error registering exit', 
      error: error.message 
    });
  }
});

// Delete motorcycle
router.delete('/:id', authenticate, tenantIsolation, async (req, res) => {
  try {
    const motorcycle = await Motorcycle.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantFilter,
    });
    
    if (!motorcycle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Motorcycle not found' 
      });
    }
    
    // Delete related records
    await Payment.deleteMany({ motorcycleId: motorcycle._id });
    await Wash.deleteMany({ motorcycleId: motorcycle._id });
    
    // Update parking lot count
    if (motorcycle.estado === 'estacionada') {
      const parkingLot = await ParkingLot.findById(req.parkingLotId);
      if (parkingLot) {
        parkingLot.currentMotorcycles = Math.max(0, parkingLot.currentMotorcycles - 1);
        await parkingLot.save();
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Motorcycle deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting motorcycle', 
      error: error.message 
    });
  }
});

// Get overdue motorcycles
router.get('/atrasos/list', authenticate, tenantIsolation, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const pagosAtrasados = await Payment.find({
      ...req.tenantFilter,
      estado: 'atrasado',
      fechaVencimiento: { $lt: hoy },
    })
      .populate({
        path: 'motorcycleId',
        populate: { path: 'clienteId' },
      })
      .sort({ fechaVencimiento: 1 });
    
    const atrasos = pagosAtrasados.map(pago => {
      const diasAtraso = Math.ceil(
        (new Date() - pago.fechaVencimiento) / (1000 * 60 * 60 * 24)
      );
      
      let severidad = 'leve';
      if (diasAtraso > 7) severidad = 'severo';
      else if (diasAtraso > 3) severidad = 'moderado';
      
      return {
        ...pago.toObject(),
        diasAtraso,
        severidad,
        motorcycle: pago.motorcycleId,
        cliente: pago.motorcycleId?.clienteId,
      };
    });
    
    res.json(atrasos);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching overdue payments', 
      error: error.message 
    });
  }
});

export default router;
