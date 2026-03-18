import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { Debt } from '../models';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;

    const debts = await Debt.find(query).sort({ createdAt: -1 });

    const summary = {
      totalDebt: debts.reduce((sum, d) => sum + d.remainingAmount, 0),
      totalPaid: debts.reduce((sum, d) => sum + d.paidAmount, 0),
      activeCount: debts.filter(d => d.status === 'active').length,
      overdueCount: debts.filter(d => d.status === 'overdue').length
    };

    res.json({ debts, summary });
  } catch (error) {
    console.error('Get debts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { name, totalAmount, interestRate, monthlyPayment, startDate, endDate, lender } = req.body;

    if (!name || !totalAmount || !startDate) {
      res.status(400).json({ error: 'Name, total amount, and start date are required' });
      return;
    }

    const debt = await Debt.create({
      userId,
      name,
      totalAmount,
      remainingAmount: totalAmount,
      paidAmount: 0,
      interestRate: interestRate || 0,
      monthlyPayment: monthlyPayment || 0,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      lender: lender || ''
    });

    res.status(201).json({ debt });
  } catch (error) {
    console.error('Create debt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/payment', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid amount is required' });
      return;
    }

    const debt = await Debt.findOne({ _id: id, userId });
    if (!debt) {
      res.status(404).json({ error: 'Debt not found' });
      return;
    }

    if (debt.status === 'paid') {
      res.status(400).json({ error: 'This debt is already paid off' });
      return;
    }

    debt.paymentHistory.push({ date: new Date(), amount, note });
    debt.paidAmount += amount;
    debt.remainingAmount = Math.max(0, debt.totalAmount - debt.paidAmount);

    if (debt.remainingAmount <= 0) {
      debt.status = 'paid';
      debt.remainingAmount = 0;
    }

    await debt.save();
    res.json({ debt });
  } catch (error) {
    console.error('Make payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const debt = await Debt.findOneAndDelete({ _id: id, userId });
    if (!debt) {
      res.status(404).json({ error: 'Debt not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete debt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
