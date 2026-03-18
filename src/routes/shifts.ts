import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { WorkShift, SalaryConfig } from '../models';
import { calculateDailySalary, getDefaultSalaryConfig } from '../services';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
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
    }).sort({ date: 1 });

    res.json({ shifts });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { date, hours, shiftType, isHoliday, notes } = req.body;
    const userId = req.userId;

    if (!date || !hours || !shiftType) {
      res.status(400).json({ error: 'Date, hours, and shiftType are required' });
      return;
    }

    let config = await SalaryConfig.findOne({ userId });
    
    if (!config) {
      config = await SalaryConfig.create(getDefaultSalaryConfig(userId!));
    }

    const dailySalary = calculateDailySalary(
      { hours, shiftType, isHoliday: isHoliday || false },
      config
    );

    const shift = await WorkShift.create({
      userId,
      date: new Date(date),
      hours,
      shiftType,
      isHoliday: isHoliday || false,
      hourlyRate: config.baseHourlyRate,
      dailySalary,
      notes
    });

    res.status(201).json({ shift });
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date, hours, shiftType, isHoliday, notes } = req.body;
    const userId = req.userId;

    const shift = await WorkShift.findOne({ _id: id, userId });
    
    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    if (date) shift.date = new Date(date);
    if (hours) shift.hours = hours;
    if (shiftType) shift.shiftType = shiftType;
    if (typeof isHoliday === 'boolean') shift.isHoliday = isHoliday;
    if (notes !== undefined) shift.notes = notes;

    const config = await SalaryConfig.findOne({ userId });
    
    if (config) {
      shift.hourlyRate = config.baseHourlyRate;
      shift.dailySalary = calculateDailySalary(
        { hours: shift.hours, shiftType: shift.shiftType, isHoliday: shift.isHoliday },
        config
      );
    }

    await shift.save();

    res.json({ shift });
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const shift = await WorkShift.findOneAndDelete({ _id: id, userId });

    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
