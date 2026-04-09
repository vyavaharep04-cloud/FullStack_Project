import express from 'express';
import { getBudget, saveBudget } from '../controllers/budget.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/:year/:month',  getBudget);
router.post('/:year/:month', saveBudget);

export default router;