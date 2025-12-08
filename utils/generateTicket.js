// Generate unique ticket number
export const generateTicketNumber = (parkingLotId) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const lotId = parkingLotId.toString().substring(18, 24); // Last 6 chars of ObjectId
  return `TKT-${lotId}-${timestamp}-${random}`;
};

// Calculate expiration date based on payment type
export const calculateExpirationDate = (tipoPago) => {
  const today = new Date();
  const expirationDate = new Date(today);

  switch (tipoPago) {
    case 'Diario':
      expirationDate.setDate(today.getDate() + 1);
      break;
    case 'Quincenal':
      expirationDate.setDate(today.getDate() + 15);
      break;
    case 'Mensual':
      expirationDate.setMonth(today.getMonth() + 1);
      break;
    default:
      expirationDate.setDate(today.getDate() + 1);
  }

  return expirationDate;
};
