import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
} catch (err) {
  console.warn('Failed to configure DNS:', err.message);
}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import User from './models/User.js';

async function reset() {
  const email = 'devendrasagar0988@gmail.com';
  const newPassword = 'password123';

  console.log(`Connecting to MongoDB to reset password for: ${email}...`);
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`🔴 User ${email} not found!`);
      return;
    }

    user.password = newPassword;
    await user.save();

    console.log(`✅ Successfully reset password for ${email} to: ${newPassword}`);
  } catch (err) {
    console.error('❌ Error resetting password:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

reset();
