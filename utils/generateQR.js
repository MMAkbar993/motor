import QRCode from 'qrcode';

export const generateTicketQR = async (ticketNumber, motorcycleData) => {
  try {
    const qrData = JSON.stringify({
      ticketNumber,
      placa: motorcycleData.placa,
      fechaEntrada: motorcycleData.fechaEntrada,
      parkingLotId: motorcycleData.parkingLotId,
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};
