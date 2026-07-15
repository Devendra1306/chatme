import { Router } from 'express';
import { getUsers, updateUserRole, deleteUser } from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requireAdmin, getUsers);
router.put('/:id/role', authenticate, requireAdmin, updateUserRole);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;
