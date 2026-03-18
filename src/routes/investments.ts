import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { Investment } from '../models';
import { getCoinPrices } from '../services/coingecko';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { type } = req.query;

    const query: Record<string, unknown> = { userId };
    if (type) query.type = type;

    const investments = await Investment.find(query).sort({ createdAt: -1 });

    const data = investments.map(inv => ({
      _id: inv._id,
      name: inv.name,
      type: inv.type,
      symbol: inv.symbol,
      coinId: inv.coinId,
      quantity: inv.quantity,
      purchasePrice: inv.purchasePrice,
      currentPrice: inv.currentPrice,
      purchaseDate: inv.purchaseDate,
      notes: inv.notes,
      totalValue: inv.quantity * inv.currentPrice,
      totalCost: inv.quantity * inv.purchasePrice,
      profitLoss: (inv.quantity * inv.currentPrice) - (inv.quantity * inv.purchasePrice),
      profitLossPercent: inv.quantity * inv.purchasePrice > 0 
        ? (((inv.quantity * inv.currentPrice) - (inv.quantity * inv.purchasePrice)) / (inv.quantity * inv.purchasePrice)) * 100
        : 0
    }));

    const summary = {
      totalValue: data.reduce((sum, inv) => sum + inv.totalValue, 0),
      totalCost: data.reduce((sum, inv) => sum + inv.totalCost, 0),
      totalProfitLoss: data.reduce((sum, inv) => sum + inv.profitLoss, 0)
    };
    summary.totalProfitLoss = summary.totalValue - summary.totalCost;

    res.json({ investments: data, summary });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { name, type, symbol, coinId, quantity, purchasePrice, currentPrice, purchaseDate, notes } = req.body;

    if (!name || !type || !quantity || !purchasePrice || !purchaseDate) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const investment = await Investment.create({
      userId,
      name,
      type,
      symbol,
      coinId,
      quantity,
      purchasePrice,
      currentPrice: currentPrice || purchasePrice,
      purchaseDate: new Date(purchaseDate),
      notes
    });

    res.status(201).json({ investment });
  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { currentPrice, notes, name, quantity } = req.body;

    const investment = await Investment.findOne({ _id: id, userId });
    if (!investment) {
      res.status(404).json({ error: 'Investment not found' });
      return;
    }

    if (currentPrice !== undefined) investment.currentPrice = currentPrice;
    if (notes !== undefined) investment.notes = notes;
    if (name !== undefined) investment.name = name;
    if (quantity !== undefined) investment.quantity = quantity;

    await investment.save();
    res.json({ investment });
  } catch (error) {
    console.error('Update investment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/update-price', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const investment = await Investment.findOne({ _id: id, userId });
    if (!investment) {
      res.status(404).json({ error: 'Investment not found' });
      return;
    }

    if (!investment.coinId) {
      res.status(400).json({ error: 'This investment does not have a CoinGecko ID' });
      return;
    }

    const prices = await getCoinPrices([investment.coinId]);
    if (!prices[investment.coinId]) {
      res.status(404).json({ error: 'Could not fetch price from CoinGecko' });
      return;
    }

    investment.currentPrice = prices[investment.coinId].current_price;
    await investment.save();

    res.json({ 
      investment,
      price: prices[investment.coinId]
    });
  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/update-all-prices', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const cryptoInvestments = await Investment.find({ userId, type: 'crypto', coinId: { $exists: true, $ne: null } });
    
    if (cryptoInvestments.length === 0) {
      res.json({ updated: 0, investments: [] });
      return;
    }

    const coinIds = cryptoInvestments.map(inv => inv.coinId!);
    const prices = await getCoinPrices(coinIds);

    let updatedCount = 0;
    const updated: Array<{ _id: string; name: string; currentPrice: number; previousPrice: number }> = [];

    for (const investment of cryptoInvestments) {
      if (prices[investment.coinId!]) {
        const previousPrice = investment.currentPrice;
        investment.currentPrice = prices[investment.coinId!].current_price;
        await investment.save();
        updatedCount++;
        updated.push({
          _id: investment._id.toString(),
          name: investment.name,
          currentPrice: investment.currentPrice,
          previousPrice
        });
      }
    }

    res.json({ updated: updatedCount, investments: updated });
  } catch (error) {
    console.error('Update all prices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const investment = await Investment.findOneAndDelete({ _id: id, userId });
    if (!investment) {
      res.status(404).json({ error: 'Investment not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete investment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
