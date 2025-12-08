// Test MongoDB connection
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB connection...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickmoto';
    console.log('URI:', mongoURI ? 'Definida' : 'No definida');
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB conectado exitosamente');
    console.log(`📊 Host: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Test query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Colecciones: ${collections.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

testConnection();
