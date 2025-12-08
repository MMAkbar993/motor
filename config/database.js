import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickmoto';
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }
    
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.error('💡 Verifica:');
    console.error('   1. Que MONGODB_URI esté correctamente configurada en .env');
    console.error('   2. Que las credenciales sean correctas');
    console.error('   3. Que tu IP esté en la whitelist de MongoDB Atlas');
    console.error('   4. Que el usuario tenga permisos de lectura/escritura');
    process.exit(1);
  }
};

export default connectDB;
