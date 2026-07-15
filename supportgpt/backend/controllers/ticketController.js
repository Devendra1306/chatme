import Ticket from '../models/Ticket.js';

export const createTicket = async (req, res, next) => {
  try {
    const ticketCount = await Ticket.countDocuments();
    const ticketNumber = `T-${(ticketCount + 1).toString().padStart(4, '0')}`;
    
    const ticket = new Ticket({
      ...req.body,
      ticketNumber,
      userId: req.user?._id
    });
    
    ticket.timeline.push({
      action: 'Created',
      by: req.user?._id || 'System',
      at: new Date(),
      note: 'Ticket created'
    });
    
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
};

export const getTickets = async (req, res, next) => {
  try {
    const { status, priority, assignee } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignedTo = assignee;

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    Object.assign(ticket, req.body);
    ticket.updatedAt = new Date();
    
    ticket.timeline.push({
      action: 'Updated',
      by: req.user?._id || 'System',
      at: new Date(),
      note: 'Ticket details updated'
    });
    
    if (req.body.status === 'resolved' && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }
    
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    ticket.comments.push({
      content: req.body.content,
      author: req.user?._id || 'System',
      createdAt: new Date()
    });
    
    ticket.updatedAt = new Date();
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const assignTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    ticket.assignedTo = req.body.assignedTo;
    ticket.timeline.push({
      action: 'Assigned',
      by: req.user?._id || 'System',
      at: new Date(),
      note: `Assigned to ${req.body.assignedTo}`
    });
    
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const escalateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    ticket.status = 'escalated';
    ticket.timeline.push({
      action: 'Escalated',
      by: req.user?._id || 'System',
      at: new Date(),
      note: req.body.reason || 'Escalated by user/agent'
    });
    
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    next(error);
  }
};
