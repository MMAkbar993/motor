// Middleware for tenant isolation - ensures users only access their own parking lot data

export const tenantIsolation = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Super admin can see everything
    if (user.rol === 'super_admin') {
      req.tenantFilter = {};
      req.parkingLotId = null; // Admin can access any parking lot
      return next();
    }

    // Owners and employees can only see their parking lot data
    if (!user.parkingLotId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No parking lot assigned to user' 
      });
    }

    req.tenantFilter = { parkingLotId: user.parkingLotId };
    req.parkingLotId = user.parkingLotId;
    
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Tenant isolation error', 
      error: error.message 
    });
  }
};

export const validateTenant = async (req, res, next) => {
  try {
    const user = req.user;
    const resourceId = req.params.id || req.body.id;
    
    if (!resourceId) {
      return next(); // No resource ID to validate
    }

    // Super admin can access anything
    if (user.rol === 'super_admin') {
      return next();
    }

    // For owners/employees, validate that the resource belongs to their parking lot
    // This will be implemented per route as needed
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Tenant validation error', 
      error: error.message 
    });
  }
};
