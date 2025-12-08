// Script para inicializar usuarios de prueba
// Ejecutar: node scripts/initUsers.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ParkingLot from '../models/ParkingLot.js';

dotenv.config();

const initUsers = async () => {
  try {
    // Conectar a MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickmoto';
    console.log('🔄 Conectando a MongoDB...');
    console.log(`📍 URI: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Ocultar credenciales en log
    
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);

    // 1. Crear usuario administrador
    let admin = await User.findOne({ email: 'admin@clickmoto.com' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = new User({
        email: 'admin@clickmoto.com',
        password: hashedPassword,
        nombre: 'Administrador',
        rol: 'super_admin',
        isActive: true,
      });
      await admin.save();
      console.log('✅ Usuario administrador creado');
      console.log('   📧 Email: admin@clickmoto.com');
      console.log('   🔑 Password: admin123');
    } else {
      console.log('⚠️  Usuario administrador ya existe');
    }

    // 2. Crear usuario owner de prueba
    let owner = await User.findOne({ email: 'owner@clickmoto.com' });
    if (!owner) {
      const hashedPassword = await bcrypt.hash('owner123', 10);
      owner = new User({
        email: 'owner@clickmoto.com',
        password: hashedPassword,
        nombre: 'Dueño de Parqueo',
        telefono: '8091234567',
        rol: 'owner',
        isActive: true,
      });
      await owner.save();

      // Crear parqueo para el owner
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
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      });
      await parkingLot.save();

      // Asignar parqueo al owner
      owner.parkingLotId = parkingLot._id;
      await owner.save();

      console.log('✅ Usuario owner creado');
      console.log('   📧 Email: owner@clickmoto.com');
      console.log('   🔑 Password: owner123');
      console.log('   🏢 Parqueo: Parqueo Central');
    } else {
      console.log('⚠️  Usuario owner ya existe');
    }

    console.log('\n📋 Usuarios disponibles:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 ADMINISTRADOR:');
    console.log('   Email: admin@clickmoto.com');
    console.log('   Password: admin123');
    console.log('   Rol: super_admin');
    console.log('   Acceso: /admin');
    console.log('');
    console.log('👤 DUEÑO DE PARQUEO:');
    console.log('   Email: owner@clickmoto.com');
    console.log('   Password: owner123');
    console.log('   Rol: owner');
    console.log('   Acceso: /todos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANTE: Cambiar las contraseñas después del primer login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

initUsers();
