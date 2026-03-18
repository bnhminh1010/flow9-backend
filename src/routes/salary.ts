import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { WorkShift, SalaryConfig } from '../models';
import { calculateMonthlySummary, getDefaultSalaryConfig } from '../services';

const router = Router();

router.use(authMiddleware);

router.get('/config', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    let config = await SalaryConfig.findOne({ userId });

    if (!config) {
      config = await SalaryConfig.create(getDefaultSalaryConfig(userId!));
    }

    res.json({ config });
  } catch (error) {
    console.error('Get salary config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/config', async (req: AuthRequest, res: Response) => {
  try {
    const { baseHourlyRate, dayShiftMultiplier, nightShiftMultiplier, holidayMultiplier, overtimeMultiplier, allowances } = req.body;
    const userId = req.userId;

    let config = await SalaryConfig.findOne({ userId });

    if (config) {
      if (baseHourlyRate !== undefined) config.baseHourlyRate = baseHourlyRate;
      if (dayShiftMultiplier !== undefined) config.dayShiftMultiplier = dayShiftMultiplier;
      if (nightShiftMultiplier !== undefined) config.nightShiftMultiplier = nightShiftMultiplier;
      if (holidayMultiplier !== undefined) config.holidayMultiplier = holidayMultiplier;
      if (overtimeMultiplier !== undefined) config.overtimeMultiplier = overtimeMultiplier;
      if (allowances !== undefined) config.allowances = allowances;

      await config.save();
    } else {
      config = await SalaryConfig.create({
        ...getDefaultSalaryConfig(userId!),
        baseHourlyRate: baseHourlyRate || 50000,
        dayShiftMultiplier: dayShiftMultiplier || 1.5,
        nightShiftMultiplier: nightShiftMultiplier || 2.0,
        holidayMultiplier: holidayMultiplier || 3.0,
        overtimeMultiplier: overtimeMultiplier || 1.5,
        allowances: allowances || []
      });
    }

    res.json({ config });
  } catch (error) {
    console.error('Update salary config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;
    const userId = req.userId;

    if (!year || !month) {
      res.status(400).json({ error: 'Year and month are required' });
      return;
    }

    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);

    const shifts = await WorkShift.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    const config = await SalaryConfig.findOne({ userId });
    
    const summary = calculateMonthlySummary(shifts, config || {
      baseHourlyRate: 50000,
      dayShiftMultiplier: 1.5,
      nightShiftMultiplier: 2.0,
      holidayMultiplier: 3.0,
      overtimeMultiplier: 1.5,
      allowances: []
    } as any);

    res.json({ summary });
  } catch (error) {
    console.error('Get salary summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
