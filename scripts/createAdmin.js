// Script to create/update admin user
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickmoto';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'admin@clickmoto.com';
    const adminPassword = 'admin123';

    // Check if admin exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      // Update existing admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin.password = hashedPassword;
      admin.isActive = true;
      admin.rol = 'super_admin';
      await admin.save();
      console.log('✅ Admin user updated');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Role: super_admin`);
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = new User({
        email: adminEmail,
        password: hashedPassword,
        nombre: 'Administrador',
        rol: 'super_admin',
        isActive: true,
      });
      await admin.save();
      console.log('✅ Admin user created');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Role: super_admin`);
    }

    // Verify the user
    const verifyUser = await User.findOne({ email: adminEmail });
    console.log('\n📋 User details:');
    console.log(`   ID: ${verifyUser._id}`);
    console.log(`   Email: ${verifyUser.email}`);
    console.log(`   Name: ${verifyUser.nombre}`);
    console.log(`   Role: ${verifyUser.rol}`);
    console.log(`   Active: ${verifyUser.isActive}`);
    console.log(`   Created: ${verifyUser.createdAt}`);

    // Test password
    const testPassword = await verifyUser.comparePassword(adminPassword);
    console.log(`\n🔐 Password test: ${testPassword ? '✅ Correct' : '❌ Incorrect'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdmin();
