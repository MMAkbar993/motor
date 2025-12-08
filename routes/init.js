// Simple initialization endpoint - creates admin user if doesn't exist
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Initialize admin user (can be called multiple times, updates password if exists)
router.post('/admin', async (req, res) => {
  try {
    const adminEmail = 'admin@clickmoto.com';
    const adminPassword = 'admin123';
    
    // Normalize email for query (same as login route)
    const normalizedEmail = adminEmail.toLowerCase().trim();
    let admin = await User.findOne({ email: normalizedEmail });
    
    if (admin) {
      // Update password if user exists - set as plain text, pre-save hook will hash it
      admin.password = adminPassword;
      admin.isActive = true;
      admin.rol = 'super_admin';
      await admin.save();
      
      return res.json({
        success: true,
        message: 'Admin user updated',
        user: {
          email: adminEmail,
          password: adminPassword,
          rol: 'super_admin',
        },
      });
    } else {
      // Create new admin user - set password as plain text, pre-save hook will hash it
      admin = new User({
        email: normalizedEmail,
        password: adminPassword,
        nombre: 'Administrador',
        rol: 'super_admin',
        isActive: true,
      });
      await admin.save();
      
      return res.json({
        success: true,
        message: 'Admin user created',
        user: {
          email: adminEmail,
          password: adminPassword,
          rol: 'super_admin',
        },
      });
    }
  } catch (error) {
    console.error('Init admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin user',
      error: error.message,
    });
  }
});

export default router;
