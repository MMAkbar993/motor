import express from 'express';
import Motorcycle from '../models/Motorcycle.js';
import Payment from '../models/Payment.js';
import ParkingLot from '../models/ParkingLot.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { generateMotorcyclesPDF, generatePaymentsPDF } from '../utils/exportPDF.js';
import { generateMotorcyclesExcel, generatePaymentsExcel } from '../utils/exportExcel.js';

const router = express.Router();

// Export motorcycles to PDF
router.get('/motorcycles/pdf', authenticate, tenantIsolation, async (req, res) => {
  try {
    const motorcycles = await Motorcycle.find(req.tenantFilter)
      .populate('clienteId')
      .sort({ fechaEntrada: -1 });
    
    const parkingLot = await ParkingLot.findById(req.parkingLotId);
    const parkingLotName = parkingLot?.nombre || 'Parqueo';
    
    const pdfBuffer = await generateMotorcyclesPDF(motorcycles, parkingLotName);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-motocicletas-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating PDF', 
      error: error.message 
    });
  }
});

// Export motorcycles to Excel
router.get('/motorcycles/excel', authenticate, tenantIsolation, async (req, res) => {
  try {
    const motorcycles = await Motorcycle.find(req.tenantFilter)
      .populate('clienteId')
      .sort({ fechaEntrada: -1 });
    
    const parkingLot = await ParkingLot.findById(req.parkingLotId);
    const parkingLotName = parkingLot?.nombre || 'Parqueo';
    
    const excelBuffer = await generateMotorcyclesExcel(motorcycles, parkingLotName);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-motocicletas-${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating Excel', 
      error: error.message 
    });
  }
});

// Export payments to PDF
router.get('/payments/pdf', authenticate, tenantIsolation, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { ...req.tenantFilter, estado: 'pagado' };
    
    if (startDate && endDate) {
      filter.fechaPago = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const payments = await Payment.find(filter)
      .populate('motorcycleId', 'placa')
      .sort({ fechaPago: -1 });
    
    const parkingLot = await ParkingLot.findById(req.parkingLotId);
    const parkingLotName = parkingLot?.nombre || 'Parqueo';
    
    const pdfBuffer = await generatePaymentsPDF(payments, parkingLotName);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-pagos-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating PDF', 
      error: error.message 
    });
  }
});

// Export payments to Excel
router.get('/payments/excel', authenticate, tenantIsolation, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { ...req.tenantFilter, estado: 'pagado' };
    
    if (startDate && endDate) {
      filter.fechaPago = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const payments = await Payment.find(filter)
      .populate('motorcycleId', 'placa')
      .sort({ fechaPago: -1 });
    
    const parkingLot = await ParkingLot.findById(req.parkingLotId);
    const parkingLotName = parkingLot?.nombre || 'Parqueo';
    
    const excelBuffer = await generatePaymentsExcel(payments, parkingLotName);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-pagos-${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating Excel', 
      error: error.message 
    });
  }
});

export default router;
