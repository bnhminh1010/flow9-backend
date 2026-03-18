import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { Budget, Transaction } from '../models';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { type } = req.query;

    const query: Record<string, unknown> = { userId };
    if (type) query.type = type;
    else query.status = { $ne: 'paused' };

    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const data = await Promise.all(budgets.map(async (b) => {
      if (b.type === 'budget' && b.category) {
        const spent = await Transaction.aggregate([
          { $match: {
            userId: b.userId,
            category: b.category,
            type: 'expense',
            date: { $gte: startOfMonth }
          }},
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        b.spent = spent[0]?.total || 0;
      }

      const percentage = b.amount > 0 
        ? Math.round(((b.type === 'budget' ? b.spent : b.currentAmount) || 0) / b.amount * 100)
        : 0;

      return {
        _id: b._id,
        name: b.name,
        type: b.type,
        category: b.category,
        amount: b.amount,
        spent: b.spent || 0,
        currentAmount: b.currentAmount || 0,
        period: b.period,
        deadline: b.deadline,
        alertThreshold: b.alertThreshold,
        status: b.status,
        percentage: Math.min(100, percentage),
        remaining: b.amount - ((b.type === 'budget' ? b.spent : b.currentAmount) || 0),
        isOverBudget: b.type === 'budget' && (b.spent || 0) > b.amount
      };
    }));

    const summary = {
      totalBudget: data.filter(d => d.type === 'budget').reduce((sum, b) => sum + b.amount, 0),
      totalSpent: data.filter(d => d.type === 'budget').reduce((sum, b) => sum + b.spent, 0),
      totalGoals: data.filter(d => d.type === 'goal').reduce((sum, b) => sum + b.amount, 0),
      totalSaved: data.filter(d => d.type === 'goal').reduce((sum, b) => sum + (b.currentAmount || 0), 0),
      budgetCount: data.filter(d => d.type === 'budget').length,
      goalCount: data.filter(d => d.type === 'goal').length
    };

    res.json({ items: data, summary });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { name, type, category, amount, period, deadline, alertThreshold } = req.body;

    if (!name || !type || !amount) {
      res.status(400).json({ error: 'Name, type, and amount are required' });
      return;
    }

    const budget = await Budget.create({
      userId,
      name,
      type,
      category: category || undefined,
      amount,
      period: type === 'budget' ? (period || 'monthly') : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      alertThreshold: alertThreshold || 80
    });

    res.status(201).json({ budget });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { currentAmount, status } = req.body;

    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (currentAmount !== undefined) {
      budget.currentAmount = currentAmount;
      if (currentAmount >= budget.amount) {
        budget.status = 'completed';
      }
    }
    if (status) budget.status = status;

    await budget.save();
    res.json({ budget });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/contribute', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid amount required' });
      return;
    }

    const budget = await Budget.findOne({ _id: id, userId, type: 'goal' });
    if (!budget) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const newAmount = (budget.currentAmount ?? 0) + amount;
    budget.currentAmount = newAmount;
    if (newAmount >= budget.amount) {
      budget.status = 'completed';
      budget.currentAmount = budget.amount;
    }

    await budget.save();
    res.json({ budget });
  } catch (error) {
    console.error('Contribute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const budget = await Budget.findOneAndDelete({ _id: id, userId });
    if (!budget) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
