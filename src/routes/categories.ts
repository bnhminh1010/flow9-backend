import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { Category } from '../models';

const router = Router();

const defaultCategories = [
  { name: 'Ăn uống', type: 'expense', icon: '🍔', color: '#ef4444' },
  { name: 'Mua sắm', type: 'expense', icon: '🛒', color: '#f97316' },
  { name: 'Đi lại', type: 'expense', icon: '🚗', color: '#eab308' },
  { name: 'Điện/nước', type: 'expense', icon: '💡', color: '#22c55e' },
  { name: 'Giải trí', type: 'expense', icon: '🎬', color: '#8b5cf6' },
  { name: 'Lương', type: 'income', icon: '💰', color: '#10b981' },
  { name: 'Thưởng', type: 'income', icon: '🎁', color: '#06b6d4' },
  { name: 'Khác', type: 'income', icon: '💵', color: '#6366f1' },
];

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { type } = req.query;

    let categories = await Category.find({ userId });

    if (categories.length === 0) {
      const defaultCats = defaultCategories.map(cat => ({
        ...cat,
        userId: new mongoose.Types.ObjectId(userId),
        isDefault: true,
        sortOrder: 0
      }));
      categories = await Category.insertMany(defaultCats) as unknown as typeof categories;
    }

    if (type) {
      categories = categories.filter(cat => cat.type === type);
    }

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { name, type, icon, color } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: 'Name and type are required' });
      return;
    }

    const category = await Category.create({
      userId,
      name,
      type,
      icon: icon || '📦',
      color: color || '#6366f1',
      isDefault: false,
      sortOrder: 0
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const category = await Category.findOne({ _id: id, userId });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (category.isDefault) {
      res.status(400).json({ error: 'Cannot delete default category' });
      return;
    }

    await Category.findByIdAndDelete(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
