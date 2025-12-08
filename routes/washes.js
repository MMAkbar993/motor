import express from 'express';
import Wash from '../models/Wash.js';
import Motorcycle from '../models/Motorcycle.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';

const router = express.Router();

// Update wash status
router.put('/motorcycles/:id/lavado', authenticate, tenantIsolation, async (req, res) => {
  try {
    const { estado, costo, tipoLavado } = req.body;
    const { id } = req.params;
    
    if (!estado) {
      return res.status(400).json({ 
        success: false, 
        message: 'Estado is required' 
      });
    }
    
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
    
    // Find or create wash record
    let wash = await Wash.findOne({
      motorcycleId: id,
      ...req.tenantFilter,
    });
    
    if (!wash) {
      wash = new Wash({
        ...req.tenantFilter,
        motorcycleId: id,
        estado: 'pendiente',
        cantidad: 0,
      });
    }
    
    // Update wash
    wash.estado = estado;
    if (costo) wash.costo = costo;
    if (tipoLavado) wash.tipoLavado = tipoLavado;
    
    if (estado === 'completado') {
      wash.cantidad += 1;
      wash.ultimoLavado = new Date();
    }
    
    await wash.save();
    
    const updatedMotorcycle = await Motorcycle.findById(id)
      .populate('clienteId');
    
    res.json({
      success: true,
      wash,
      motorcycle: {
        ...updatedMotorcycle.toObject(),
        cliente: updatedMotorcycle.clienteId,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating wash', 
      error: error.message 
    });
  }
});

// Get all washes
router.get('/', authenticate, tenantIsolation, async (req, res) => {
  try {
    const { estado } = req.query;
    
    const filter = { ...req.tenantFilter };
    if (estado) filter.estado = estado;
    
    const washes = await Wash.find(filter)
      .populate({
        path: 'motorcycleId',
        populate: { path: 'clienteId' },
      })
      .sort({ createdAt: -1 });
    
    res.json(washes);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching washes', 
      error: error.message 
    });
  }
});

// Get wash summary
router.get('/resumen', authenticate, tenantIsolation, async (req, res) => {
  try {
    const total = await Wash.countDocuments(req.tenantFilter);
    const pendientes = await Wash.countDocuments({
      ...req.tenantFilter,
      estado: 'pendiente',
    });
    const enProceso = await Wash.countDocuments({
      ...req.tenantFilter,
      estado: 'en_proceso',
    });
    const completados = await Wash.countDocuments({
      ...req.tenantFilter,
      estado: 'completado',
    });
    
    res.json({
      success: true,
      total,
      pendientes,
      enProceso,
      completados,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching wash summary', 
      error: error.message 
    });
  }
});

export default router;
