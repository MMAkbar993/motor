import PDFDocument from 'pdfkit';

export const generateMotorcyclesPDF = (motorcycles, parkingLotName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Header
      doc.fontSize(20).text('Reporte de Motocicletas', { align: 'center' });
      doc.fontSize(12).text(`Parqueo: ${parkingLotName}`, { align: 'center' });
      doc.fontSize(10).text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
      doc.moveDown();
      
      // Table header
      doc.fontSize(10);
      doc.text('Placa', 50, doc.y);
      doc.text('Modelo', 150, doc.y);
      doc.text('Cliente', 250, doc.y);
      doc.text('Estado', 400, doc.y);
      doc.text('Días', 480, doc.y);
      
      doc.moveTo(50, doc.y + 5)
        .lineTo(550, doc.y + 5)
        .stroke();
      
      doc.moveDown(0.5);
      
      // Table rows
      motorcycles.forEach((moto, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        
        doc.text(moto.placa || '-', 50, doc.y);
        doc.text(moto.modelo || '-', 150, doc.y);
        doc.text(moto.cliente?.nombre || '-', 250, doc.y);
        doc.text(moto.estado || '-', 400, doc.y);
        doc.text(moto.diasEstacionada?.toString() || '0', 480, doc.y);
        
        doc.moveDown(0.5);
      });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const generatePaymentsPDF = (payments, parkingLotName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Header
      doc.fontSize(20).text('Reporte de Pagos', { align: 'center' });
      doc.fontSize(12).text(`Parqueo: ${parkingLotName}`, { align: 'center' });
      doc.fontSize(10).text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
      doc.moveDown();
      
      const total = payments.reduce((sum, p) => sum + (p.monto || 0), 0);
      
      doc.fontSize(10);
      payments.forEach((payment, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        
        doc.text(`Pago ${index + 1}:`, 50, doc.y);
        doc.text(`Monto: $${payment.monto}`, 150, doc.y);
        doc.text(`Tipo: ${payment.tipo}`, 300, doc.y);
        doc.text(`Estado: ${payment.estado}`, 400, doc.y);
        doc.moveDown(0.5);
      });
      
      doc.moveDown();
      doc.fontSize(12).text(`Total: $${total.toFixed(2)}`, { align: 'right' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
