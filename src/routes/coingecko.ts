import { Router, Request, Response } from 'express';
import { searchCoins, getCoinPrices, getTopCoins, getCoinDetails } from '../services/coingecko';

const router = Router();

router.get('/coins/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    
    const coins = await searchCoins(q);
    res.json({ coins });
  } catch (error) {
    console.error('Coin search error:', error);
    res.status(500).json({ error: 'Failed to search coins' });
  }
});

router.get('/coins/top', async (_req: Request, res: Response) => {
  try {
    const coins = await getTopCoins(50);
    res.json({ coins });
  } catch (error) {
    console.error('Top coins error:', error);
    res.status(500).json({ error: 'Failed to fetch top coins' });
  }
});

router.get('/coins/:id/price', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const coin = await getCoinDetails(id);
    
    if (!coin) {
      res.status(404).json({ error: 'Coin not found' });
      return;
    }
    
    res.json({ coin });
  } catch (error) {
    console.error('Coin price error:', error);
    res.status(500).json({ error: 'Failed to fetch coin price' });
  }
});

router.post('/coins/prices', async (req: Request, res: Response) => {
  try {
    const { coinIds } = req.body as { coinIds: string[] };
    
    if (!Array.isArray(coinIds)) {
      res.status(400).json({ error: 'coinIds must be an array' });
      return;
    }
    
    const prices = await getCoinPrices(coinIds);
    res.json({ prices });
  } catch (error) {
    console.error('Coin prices error:', error);
    res.status(500).json({ error: 'Failed to fetch coin prices' });
  }
});

export default router;
