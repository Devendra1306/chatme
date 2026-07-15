/**
 * SupportGPT Backend - Main Entry Point
 * Express 5 + Socket.io + MongoDB
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { connectDB } from './config/db.js';

// Route imports
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import ragRoutes from './routes/rag.js';
import documentRoutes from './routes/documents.js';
import ticketRoutes from './routes/tickets.js';
import analyticsRoutes from './routes/analytics.js';
import knowledgeRoutes from './routes/knowledge.js';
import userRoutes from './routes/users.js';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const httpServer = createServer(app);

// ─── Socket.io setup ─────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app so controllers can access it
app.set('io', io);

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// ─── Request logger (dev only) ────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SupportGPT Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/users', userRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Socket.io Live Chat Handler ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Join a conversation room
  socket.on('join_room', ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`[Socket.io] User ${userId || socket.id} joined room: ${roomId}`);
    socket.to(roomId).emit('user_joined', {
      userId,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  // Leave a conversation room
  socket.on('leave_room', ({ roomId, userId }) => {
    socket.leave(roomId);
    console.log(`[Socket.io] User ${userId || socket.id} left room: ${roomId}`);
    socket.to(roomId).emit('user_left', {
      userId,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  // Send a message in a room
  socket.on('send_message', ({ roomId, message, userId }) => {
    const payload = {
      ...message,
      userId,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    };
    // Broadcast to everyone else in the room
    socket.to(roomId).emit('receive_message', payload);
  });

  // Typing indicator
  socket.on('typing_start', ({ roomId, userId }) => {
    socket.to(roomId).emit('user_typing', { userId, isTyping: true });
  });

  socket.on('typing_stop', ({ roomId, userId }) => {
    socket.to(roomId).emit('user_typing', { userId, isTyping: false });
  });

  // Agent escalation event
  socket.on('escalate_chat', ({ roomId, ticketId, agentId }) => {
    io.to(roomId).emit('chat_escalated', {
      ticketId,
      agentId,
      timestamp: new Date().toISOString(),
      message: 'This conversation has been escalated to a human agent.',
    });
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
  });
});

// ─── ASCII Banner ─────────────────────────────────────────────────────────────
function printBanner(port) {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ███████╗██╗   ██╗██████╗ ██████╗  ██████╗ ██████╗ ║
║  ██╔════╝██║   ██║██╔══██╗██╔══██╗██╔═══██╗╚════██╗ ║
║  ███████╗██║   ██║██████╔╝██████╔╝██║   ██║  ▄███╔╝ ║
║  ╚════██║██║   ██║██╔═══╝ ██╔═══╝ ██║   ██║  ▀▀══╝  ║
║  ███████║╚██████╔╝██║     ██║     ╚██████╔╝  ██╗    ║
║  ╚══════╝ ╚═════╝ ╚═╝     ╚═╝      ╚═════╝   ╚═╝    ║
║                                                       ║
║   G P T   —   AI Customer Support Platform           ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║  Server  : http://localhost:${port}                      ║
║  Env     : ${(process.env.NODE_ENV || 'development').padEnd(12)}                          ║
║  Model   : ${(process.env.GEMINI_MODEL || 'gemini-2.5-flash').padEnd(25)}          ║
╚═══════════════════════════════════════════════════════╝
  `);
}

// ─── Startup ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5001', 10);

async function start() {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start HTTP + Socket.io server
    httpServer.listen(PORT, () => {
      printBanner(PORT);
    });
  } catch (err) {
    console.error('[Startup] Fatal error:', err);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Process] SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('[Process] HTTP server closed.');
    process.exit(0);
  });
});

start();

export { app, io };
