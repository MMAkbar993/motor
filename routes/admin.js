import express from 'express';
import ParkingLot from '../models/ParkingLot.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Motorcycle from '../models/Motorcycle.js';
import Payment from '../models/Payment.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require super_admin role
router.use(authenticate);
router.use(requireRole('super_admin'));

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalParkingLots = await ParkingLot.countDocuments();
    const activeParkingLots = await ParkingLot.countDocuments({ isActive: true });
    const activeSubscriptions = await ParkingLot.countDocuments({ 
      subscriptionStatus: 'active' 
    });
    
    const totalMotorcycles = await Motorcycle.countDocuments();
    const totalPayments = await Payment.countDocuments({ estado: 'pagado' });
    const totalRevenue = await Payment.aggregate([
      { $match: { estado: 'pagado' } },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ]);
    
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          estado: 'pagado',
          fechaPago: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$monto' } } },
    ]);
    
    res.json({
      success: true,
      stats: {
        totalParkingLots,
        activeParkingLots,
        activeSubscriptions,
        totalMotorcycles,
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching admin stats', 
      error: error.message 
    });
  }
});

// Get all parking lots
router.get('/parking-lots', async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find()
      .populate('ownerId', 'nombre email telefono')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      parkingLots,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching parking lots', 
      error: error.message 
    });
  }
});

// Get single parking lot
router.get('/parking-lots/:id', async (req, res) => {
  try {
    const parkingLot = await ParkingLot.findById(req.params.id)
      .populate('ownerId');
    
    if (!parkingLot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parking lot not found' 
      });
    }
    
    const stats = {
      totalMotorcycles: await Motorcycle.countDocuments({ 
        parkingLotId: parkingLot._id 
      }),
      activeMotorcycles: await Motorcycle.countDocuments({ 
        parkingLotId: parkingLot._id, 
        estado: 'estacionada' 
      }),
      totalPayments: await Payment.countDocuments({ 
        parkingLotId: parkingLot._id 
      }),
    };
    
    res.json({
      success: true,
      parkingLot: {
        ...parkingLot.toObject(),
        stats,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching parking lot', 
      error: error.message 
    });
  }
});

// Update parking lot
router.put('/parking-lots/:id', async (req, res) => {
  try {
    const { subscriptionStatus, subscriptionPlan, maxMotorcycles, isActive } = req.body;
    
    const parkingLot = await ParkingLot.findByIdAndUpdate(
      req.params.id,
      {
        ...(subscriptionStatus && { subscriptionStatus }),
        ...(subscriptionPlan && { subscriptionPlan }),
        ...(maxMotorcycles && { maxMotorcycles }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, runValidators: true }
    ).populate('ownerId');
    
    if (!parkingLot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parking lot not found' 
      });
    }
    
    res.json({
      success: true,
      parkingLot,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating parking lot', 
      error: error.message 
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { rol } = req.query;
    const filter = {};
    if (rol) filter.rol = rol;
    
    const users = await User.find(filter)
      .select('-password')
      .populate('parkingLotId', 'nombre')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users', 
      error: error.message 
    });
  }
});

// Create new user (admin or owner)
router.post('/users', async (req, res) => {
  try {
    const { email, password, nombre, telefono, rol, parkingLotId } = req.body;

    if (!email || !password || !nombre || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, nombre and rol are required',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Validate rol
    if (!['super_admin', 'owner', 'employee'].includes(rol)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rol. Must be super_admin, owner, or employee',
      });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save hook
      nombre: nombre.trim(),
      telefono: telefono?.trim(),
      rol,
      parkingLotId: parkingLotId || null,
      isActive: true,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { isActive, rol, nombre, telefono } = req.body;
    
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (rol) updateData.rol = rol;
    if (nombre) updateData.nombre = nombre.trim();
    if (telefono !== undefined) updateData.telefono = telefono?.trim();
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating user', 
      error: error.message 
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Prevent deleting super_admin users
    if (user.rol === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin users',
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user', 
      error: error.message 
    });
  }
});

// Get all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('parkingLotId', 'nombre ownerId')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching subscriptions', 
      error: error.message 
    });
  }
});

export default router;
