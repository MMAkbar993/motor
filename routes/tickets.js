import express from 'express';
import Motorcycle from '../models/Motorcycle.js';
import ParkingLot from '../models/ParkingLot.js';
import { authenticate } from '../middleware/auth.js';
import { tenantIsolation } from '../middleware/tenantIsolation.js';
import { generateTicketQR } from '../utils/generateQR.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Generate ticket PDF with QR code
router.get('/:ticketNumber/pdf', authenticate, tenantIsolation, async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const motorcycle = await Motorcycle.findOne({
      ticketNumber,
      ...req.tenantFilter,
    })
      .populate('clienteId')
      .populate('parkingLotId');

    if (!motorcycle) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Generate QR code
    const qrCodeDataURL = await generateTicketQR(ticketNumber, motorcycle);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: [300, 400] });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticketNumber}.pdf`);
      res.send(Buffer.concat(chunks));
    });

    // Ticket content
    doc.fontSize(18).text('TICKET DE ESTACIONAMIENTO', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Parqueo: ${motorcycle.parkingLotId?.nombre || 'N/A'}`, { align: 'center' });
    doc.text(`Ticket: ${ticketNumber}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Placa: ${motorcycle.placa}`);
    doc.text(`Marca: ${motorcycle.marca}`);
    doc.text(`Modelo: ${motorcycle.modelo}`);
    doc.text(`Color: ${motorcycle.color || 'N/A'}`);
    doc.moveDown();

    doc.text(`Cliente: ${motorcycle.clienteId?.nombre || 'N/A'}`);
    doc.text(`Teléfono: ${motorcycle.clienteId?.telefono || 'N/A'}`);
    doc.moveDown();

    doc.text(`Fecha Entrada: ${new Date(motorcycle.fechaEntrada).toLocaleString('es-ES')}`);
    doc.moveDown();

    // Add QR code (as base64 image)
    if (qrCodeDataURL) {
      const qrImage = qrCodeDataURL.split(',')[1];
      doc.image(Buffer.from(qrImage, 'base64'), {
        fit: [100, 100],
        align: 'center',
      });
    }

    doc.moveDown();
    doc.fontSize(8).text('Conserve este ticket para retirar su motocicleta', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating ticket PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating ticket',
      error: error.message,
    });
  }
});

// Get ticket info
router.get('/:ticketNumber', authenticate, tenantIsolation, async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const motorcycle = await Motorcycle.findOne({
      ticketNumber,
      ...req.tenantFilter,
    })
      .populate('clienteId')
      .populate('parkingLotId');

    if (!motorcycle) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Generate QR code data URL
    const qrCodeDataURL = await generateTicketQR(ticketNumber, motorcycle);

    res.json({
      success: true,
      ticket: {
        ticketNumber: motorcycle.ticketNumber,
        motorcycle: {
          placa: motorcycle.placa,
          marca: motorcycle.marca,
          modelo: motorcycle.modelo,
          color: motorcycle.color,
        },
        cliente: motorcycle.clienteId,
        fechaEntrada: motorcycle.fechaEntrada,
        parkingLot: motorcycle.parkingLotId?.nombre,
        qrCode: qrCodeDataURL,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message,
    });
  }
});

export default router;
