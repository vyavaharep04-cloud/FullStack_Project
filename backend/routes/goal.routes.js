import express from 'express';
import { getGoals, addGoal, updateGoal, deleteGoal, addContribution } from '../controllers/goal.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/',                   getGoals);
router.post('/',                  addGoal);
router.put('/:id',                updateGoal);
router.delete('/:id',             deleteGoal);
router.post('/:id/contribute',    addContribution);

export default router;