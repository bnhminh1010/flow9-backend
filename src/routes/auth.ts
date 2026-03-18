import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { generateToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;

    if (!pin || typeof pin !== 'string') {
      res.status(400).json({ error: 'PIN is required' });
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      res.status(400).json({ error: 'PIN must be 6 digits' });
      return;
    }

    let user = await User.findOne();
    
    if (!user) {
      const hashedPin = await bcrypt.hash(pin, 10);
      user = await User.create({ pin: hashedPin });
    }

    const isValidPin = await bcrypt.compare(pin, user.pin);
    
    if (!isValidPin) {
      res.status(401).json({ error: 'Invalid PIN' });
      return;
    }

    const token = generateToken(user._id.toString());

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({ success: true, userId: user._id, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const bearerToken = req.headers.authorization?.split(' ')[1];
    const cookieToken = req.cookies?.token;
    const token = cookieToken || bearerToken;
    
    if (!token) {
      res.status(401).json({ valid: false });
      return;
    }

    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'flow9-secret-key';
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    res.json({ valid: true, userId: decoded.userId });
  } catch {
    res.status(401).json({ valid: false });
  }
});

router.post('/change-pin', async (req: Request, res: Response) => {
  try {
    const { oldPin, newPin } = req.body;

    if (!oldPin || !newPin) {
      res.status(400).json({ error: 'Old PIN and new PIN are required' });
      return;
    }

    if (!/^\d{6}$/.test(newPin)) {
      res.status(400).json({ error: 'New PIN must be 6 digits' });
      return;
    }

    const user = await User.findOne();
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isValidPin = await bcrypt.compare(oldPin, user.pin);
    
    if (!isValidPin) {
      res.status(401).json({ error: 'Invalid old PIN' });
      return;
    }

    user.pin = await bcrypt.hash(newPin, 10);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Change PIN error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
