import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import motorcycleRoutes from './routes/motorcycles.js';
import paymentRoutes from './routes/payments.js';
import washRoutes from './routes/washes.js';
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/reports.js';
import subscriptionRoutes from './routes/subscriptions.js';
import ticketRoutes from './routes/tickets.js';
import setupRoutes from './routes/setup.js';
import initRoutes from './routes/init.js';

dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: process.env.UPLOAD_MAX_SIZE || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.UPLOAD_MAX_SIZE || '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/motorcycles', motorcycleRoutes);
app.use('/api/pagos', paymentRoutes);
app.use('/api/lavados', washRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/init', initRoutes);
  
// Health check
app.get('/api/health', (req, res) => {
    res.json({
    status: 'OK', 
    message: 'ClickMoto API funcionando',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

