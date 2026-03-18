import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { Transaction, Category } from '../models';
import { parseNLP } from '../services';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { year, month, type, category } = req.query;

    const query: Record<string, unknown> = { userId };

    if (year && month) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (type) query.type = type;
    if (category) query.category = category;

    console.log('=== GET TRANSACTIONS DEBUG ===');
    console.log('userId:', userId);
    console.log('query:', query);
    
    const transactions = await Transaction.find(query).sort({ date: -1 });
    console.log('found transactions:', transactions.length);
    console.log('sample:', transactions[0]);

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { input, type, amount, category, description, date, isRecurring, recurringConfig } = req.body;

    let transactionData: {
      userId: string;
      type: 'income' | 'expense';
      amount: number;
      category: string;
      description: string;
      date: Date;
      isRecurring: boolean;
      recurringConfig?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        endDate?: Date;
        nextRunDate: Date;
      };
    };

    if (input) {
      const parsed = parseNLP(input);
      
      transactionData = {
        userId: userId!,
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: date ? new Date(date) : new Date(),
        isRecurring: false
      };
    } else {
      if (!type || !amount || !category) {
        res.status(400).json({ error: 'Type, amount, and category are required' });
        return;
      }

      transactionData = {
        userId: userId!,
        type,
        amount,
        category,
        description: description || '',
        date: date ? new Date(date) : new Date(),
        isRecurring: isRecurring || false
      };
    }

    if (isRecurring && recurringConfig) {
      transactionData.isRecurring = true;
      transactionData.recurringConfig = {
        frequency: recurringConfig.frequency,
        endDate: recurringConfig.endDate ? new Date(recurringConfig.endDate) : undefined,
        nextRunDate: new Date()
      };
    }

    const transaction = await Transaction.create(transactionData);

    res.status(201).json({ transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updates = req.body;

    const transaction = await Transaction.findOne({ _id: id, userId });

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const allowedUpdates = ['type', 'amount', 'category', 'description', 'date', 'isRecurring', 'recurringConfig'];
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        (transaction as any)[key] = key === 'date' || key === 'recurringConfig.endDate' || key === 'recurringConfig.nextRunDate' 
          ? new Date(updates[key]) 
          : updates[key];
      }
    }

    await transaction.save();

    res.json({ transaction });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const transaction = await Transaction.findOneAndDelete({ _id: id, userId });

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/aggregate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const mongoose = await import('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const { year, month } = req.query;

    const matchStage: Record<string, unknown> = { userId: userObjectId };

    if (year && month) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);
      matchStage.date = { $gte: startDate, $lte: endDate };
    }

    const byCategory = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const byMonth = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7Days = await Transaction.aggregate([
      { $match: { userId: userObjectId, date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ byCategory, byMonth, last7Days });
  } catch (error) {
    console.error('Get aggregate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
