// Route for initial setup - only works if no users exist
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import ParkingLot from '../models/ParkingLot.js';

const router = express.Router();

// Initialize default users (only if database is empty)
router.post('/init', async (req, res) => {
  try {
    // Check if any users exist
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Users already exist. Use /api/auth/register to create new users.',
      });
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      email: 'admin@clickmoto.com',
      password: adminPassword,
      nombre: 'Administrador',
      rol: 'super_admin',
      isActive: true,
    });
    await admin.save();

    // Create owner user with parking lot
    const ownerPassword = await bcrypt.hash('owner123', 10);
    const owner = new User({
      email: 'owner@clickmoto.com',
      password: ownerPassword,
      nombre: 'Dueño de Parqueo',
      telefono: '8091234567',
      rol: 'owner',
      isActive: true,
    });
    await owner.save();

    // Create parking lot for owner
    const parkingLot = new ParkingLot({
      nombre: 'Parqueo Central',
      direccion: 'Calle Principal 123',
      telefono: '8091234567',
      email: 'owner@clickmoto.com',
      ownerId: owner._id,
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      maxMotorcycles: 50,
      monthlyFee: 29.99,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await parkingLot.save();

    owner.parkingLotId = parkingLot._id;
    await owner.save();

    res.json({
      success: true,
      message: 'Default users created successfully',
      users: {
        admin: {
          email: 'admin@clickmoto.com',
          password: 'admin123',
          rol: 'super_admin',
        },
        owner: {
          email: 'owner@clickmoto.com',
          password: 'owner123',
          rol: 'owner',
        },
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating default users',
      error: error.message,
    });
  }
});

export default router;
