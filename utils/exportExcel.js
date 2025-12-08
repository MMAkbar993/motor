import ExcelJS from 'exceljs';

export const generateMotorcyclesExcel = async (motorcycles, parkingLotName) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Motocicletas');
  
  // Header row
  worksheet.columns = [
    { header: 'Placa', key: 'placa', width: 15 },
    { header: 'Marca', key: 'marca', width: 15 },
    { header: 'Modelo', key: 'modelo', width: 15 },
    { header: 'Color', key: 'color', width: 15 },
    { header: 'Cliente', key: 'cliente', width: 30 },
    { header: 'Teléfono', key: 'telefono', width: 15 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Días Estacionada', key: 'dias', width: 15 },
    { header: 'Fecha Entrada', key: 'fechaEntrada', width: 20 },
  ];
  
  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // Add data
  motorcycles.forEach((moto) => {
    worksheet.addRow({
      placa: moto.placa,
      marca: moto.marca,
      modelo: moto.modelo,
      color: moto.color,
      cliente: moto.cliente?.nombre || '-',
      telefono: moto.cliente?.telefono || '-',
      estado: moto.estado,
      dias: moto.diasEstacionada || 0,
      fechaEntrada: moto.fechaEntrada ? new Date(moto.fechaEntrada).toLocaleDateString('es-ES') : '-',
    });
  });
  
  // Add title
  worksheet.insertRow(1, [`Reporte de Motocicletas - ${parkingLotName}`]);
  worksheet.mergeCells('A1:I1');
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export const generatePaymentsExcel = async (payments, parkingLotName) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Pagos');
  
  worksheet.columns = [
    { header: 'Fecha Pago', key: 'fechaPago', width: 20 },
    { header: 'Monto', key: 'monto', width: 15 },
    { header: 'Tipo', key: 'tipo', width: 15 },
    { header: 'Método', key: 'metodo', width: 15 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Placa Motocicleta', key: 'placa', width: 15 },
  ];
  
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  payments.forEach((payment) => {
    worksheet.addRow({
      fechaPago: payment.fechaPago ? new Date(payment.fechaPago).toLocaleDateString('es-ES') : '-',
      monto: payment.monto,
      tipo: payment.tipo,
      metodo: payment.metodoPago || '-',
      estado: payment.estado,
      placa: payment.motorcycleId?.placa || '-',
    });
  });
  
  const total = payments.reduce((sum, p) => sum + (p.monto || 0), 0);
  worksheet.addRow({});
  worksheet.addRow({
    monto: `Total: $${total.toFixed(2)}`,
  });
  
  worksheet.insertRow(1, [`Reporte de Pagos - ${parkingLotName}`]);
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
