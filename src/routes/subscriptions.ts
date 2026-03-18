import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { Subscription } from '../models';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { isActive } = req.query;

    const query: Record<string, unknown> = { userId };
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const subscriptions = await Subscription.find(query).sort({ nextBillingDate: 1 });

    res.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/upcoming', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const reminderDays = parseInt(req.query.days as string) || 7;

    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + reminderDays);

    const subscriptions = await Subscription.find({
      userId,
      isActive: true,
      nextBillingDate: { $lte: upcomingDate }
    }).sort({ nextBillingDate: 1 });

    const result = subscriptions.map(sub => {
      const now = new Date();
      const diffTime = sub.nextBillingDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        _id: sub._id,
        name: sub.name,
        amount: sub.amount,
        currency: sub.currency,
        nextBillingDate: sub.nextBillingDate,
        daysUntil: Math.max(0, daysUntil)
      };
    });

    res.json({ subscriptions: result });
  } catch (error) {
    console.error('Get upcoming subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, amount, currency, billingCycle, nextBillingDate, category, reminderDays, paymentMethod, notes } = req.body;
    const userId = req.userId;

    if (!name || !amount || !billingCycle || !nextBillingDate) {
      res.status(400).json({ error: 'Name, amount, billingCycle, and nextBillingDate are required' });
      return;
    }

    const subscription = await Subscription.create({
      userId,
      name,
      amount,
      currency: currency || 'VND',
      billingCycle,
      nextBillingDate: new Date(nextBillingDate),
      category: category || 'Other',
      reminderDays: reminderDays || 2,
      isActive: true,
      paymentMethod,
      notes,
      paymentHistory: []
    });

    res.status(201).json({ subscription });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updates = req.body;

    const subscription = await Subscription.findOne({ _id: id, userId });

    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    const allowedUpdates = ['name', 'amount', 'currency', 'billingCycle', 'nextBillingDate', 'category', 'isActive', 'reminderDays', 'paymentMethod', 'notes'];
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        (subscription as any)[key] = key === 'nextBillingDate' ? new Date(updates[key]) : updates[key];
      }
    }

    await subscription.save();

    res.json({ subscription });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const subscription = await Subscription.findOneAndDelete({ _id: id, userId });

    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/pay', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amount, notes } = req.body;

    const subscription = await Subscription.findOne({ _id: id, userId });

    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    const paymentAmount = amount || subscription.amount;

    const paymentRecord = {
      date: new Date(),
      amount: paymentAmount,
      status: 'paid' as const,
      notes: notes || ''
    };

    subscription.paymentHistory = subscription.paymentHistory || [];
    subscription.paymentHistory.push(paymentRecord);

    let nextBillingDate = new Date(subscription.nextBillingDate);
    switch (subscription.billingCycle) {
      case 'weekly':
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);
        break;
      case 'monthly':
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        break;
      case 'yearly':
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        break;
    }
    subscription.nextBillingDate = nextBillingDate;

    await subscription.save();

    res.json({ subscription, payment: paymentRecord });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
