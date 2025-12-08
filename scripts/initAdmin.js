// Script para inicializar usuario administrador
// Ejecutar: node scripts/initAdmin.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const initAdmin = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clickmoto');
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe admin
    const existingAdmin = await User.findOne({ email: 'admin@clickmoto.com' });
    if (existingAdmin) {
      console.log('⚠️  Usuario administrador ya existe');
      process.exit(0);
    }

    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      email: 'admin@clickmoto.com',
      password: hashedPassword,
      nombre: 'Administrador',
      rol: 'super_admin',
      isActive: true,
    });

    await admin.save();
    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Email: admin@clickmoto.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del primer login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

initAdmin();
