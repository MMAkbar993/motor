import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ParkingLot from '../models/ParkingLot.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register new owner
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, telefono, parkingLotName, direccion, planType } = req.body;

    // Validate required fields
    if (!email || !password || !nombre || !parkingLotName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Create user
    const user = new User({
      email,
      password,
      nombre,
      telefono,
      rol: 'owner',
    });

    await user.save();

    // Create parking lot
    const planLimits = {
      basic: { maxMotorcycles: 50, monthlyFee: 29.99 },
      premium: { maxMotorcycles: 200, monthlyFee: 79.99 },
      enterprise: { maxMotorcycles: 9999, monthlyFee: 199.99 },
    };

    const selectedPlan = planLimits[planType] || planLimits.basic;
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    const parkingLot = new ParkingLot({
      nombre: parkingLotName,
      direccion,
      ownerId: user._id,
      subscriptionPlan: planType || 'basic',
      subscriptionStatus: 'trial',
      maxMotorcycles: selectedPlan.maxMotorcycles,
      monthlyFee: selectedPlan.monthlyFee,
      subscriptionStartDate: new Date(),
      subscriptionEndDate,
    });

    await parkingLot.save();

    // Update user with parkingLotId
    user.parkingLotId = parkingLot._id;
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, rol: user.rol, parkingLotId: parkingLot._id },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        parkingLotId: parkingLot._id,
      },
      parkingLot: {
        id: parkingLot._id,
        nombre: parkingLot.nombre,
        subscriptionPlan: parkingLot.subscriptionPlan,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`❌ Login attempt failed: User not found - ${normalizedEmail}`);
      console.log(`💡 Tip: Create admin user with POST /api/init/admin`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials. User not found. Create admin with /api/init/admin' 
      });
    }

    if (!user.isActive) {
      console.log(`Login attempt failed: Account inactive - ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Account is inactive' 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`❌ Login attempt failed: Password mismatch - ${normalizedEmail}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials. Password incorrect.' 
      });
    }
    
    console.log(`✅ Login successful: ${normalizedEmail} (${user.rol})`);

    // Get parking lot info if user is owner/employee
    let parkingLot = null;
    if (user.parkingLotId) {
      parkingLot = await ParkingLot.findById(user.parkingLotId);
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        rol: user.rol, 
        parkingLotId: user.parkingLotId 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        parkingLotId: user.parkingLotId,
      },
      parkingLot: parkingLot ? {
        id: parkingLot._id,
        nombre: parkingLot.nombre,
        subscriptionPlan: parkingLot.subscriptionPlan,
        subscriptionStatus: parkingLot.subscriptionStatus,
      } : null,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed', 
      error: error.message 
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    let parkingLot = null;
    if (user.parkingLotId) {
      parkingLot = await ParkingLot.findById(user.parkingLotId);
    }

    console.log(`/me endpoint: User ${user.email} (${user.rol}) authenticated`);

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        parkingLotId: user.parkingLotId,
        isActive: user.isActive,
      },
      parkingLot: parkingLot ? {
        id: parkingLot._id,
        nombre: parkingLot.nombre,
        subscriptionPlan: parkingLot.subscriptionPlan,
        subscriptionStatus: parkingLot.subscriptionStatus,
        maxMotorcycles: parkingLot.maxMotorcycles,
        currentMotorcycles: parkingLot.currentMotorcycles,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user', 
      error: error.message 
    });
  }
});

export default router;
