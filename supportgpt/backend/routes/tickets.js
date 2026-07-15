import express from 'express';
import { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, addComment, assignTicket, escalateTicket } from '../controllers/ticketController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalAuth, createTicket);
router.get('/', optionalAuth, getTickets);
router.get('/:id', optionalAuth, getTicketById);
router.put('/:id', optionalAuth, updateTicket);
router.delete('/:id', optionalAuth, deleteTicket);

router.post('/:id/comments', optionalAuth, addComment);
router.post('/:id/assign', optionalAuth, assignTicket);
router.post('/:id/escalate', optionalAuth, escalateTicket);

export default router;
