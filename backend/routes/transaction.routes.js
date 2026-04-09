import express from 'express';
import { getTransactions, addTransaction, deleteTransaction } from '../controllers/transaction.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

// All transaction routes are protected — JWT required
router.use(protect);

router.get('/',     getTransactions);
router.post('/',    addTransaction);
router.delete('/:id', deleteTransaction);

export default router;