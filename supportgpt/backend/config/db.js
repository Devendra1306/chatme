import mongoose from 'mongoose';

const connectDB = async (retries = 5, delay = 3000) => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState === 2) {
    // Wait for the existing connection handshake to complete
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
    return mongoose.connection;
  }

  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i}/${retries} failed: ${error.message}`);
      if (i < retries) {
        console.log(`🔄 Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error('❌ Could not connect to MongoDB after all retries. Check your MONGODB_URI and network/VPN.');
        // Don't exit — let server run without DB so health endpoint works
      }
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

export default connectDB;

