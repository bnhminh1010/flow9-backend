import { ISalaryConfig } from '../models/SalaryConfig';
import { IWorkShift } from '../models/WorkShift';

export interface ShiftInput {
  hours: number;
  shiftType: 'day' | 'night' | 'holiday';
  isHoliday: boolean;
}

export interface MonthlySummary {
  totalSalary: number;
  totalHours: number;
  totalShifts: number;
  byShiftType: {
    day: number;
    night: number;
    holiday: number;
  };
}

export function calculateDailySalary(
  shift: ShiftInput,
  config: ISalaryConfig
): number {
  const { hours, shiftType, isHoliday } = shift;
  const baseRate = config.baseHourlyRate;

  let multiplier = 1;
  
  if (isHoliday) {
    multiplier = config.holidayMultiplier;
  } else if (shiftType === 'night') {
    multiplier = config.nightShiftMultiplier;
  } else if (shiftType === 'day') {
    multiplier = config.dayShiftMultiplier;
  }

  return Math.round(hours * baseRate * multiplier);
}

export function calculateMonthlySummary(
  shifts: IWorkShift[],
  config: ISalaryConfig
): MonthlySummary {
  const summary: MonthlySummary = {
    totalSalary: 0,
    totalHours: 0,
    totalShifts: shifts.length,
    byShiftType: {
      day: 0,
      night: 0,
      holiday: 0
    }
  };

  for (const shift of shifts) {
    const dailySalary = calculateDailySalary(
      {
        hours: shift.hours,
        shiftType: shift.shiftType,
        isHoliday: shift.isHoliday
      },
      config
    );

    summary.totalSalary += dailySalary;
    summary.totalHours += shift.hours;
    summary.byShiftType[shift.shiftType] += dailySalary;
  }

  return summary;
}

export function getDefaultSalaryConfig(userId: string): Partial<ISalaryConfig> {
  return {
    userId: userId as unknown as import('mongoose').Types.ObjectId,
    baseHourlyRate: 50000,
    dayShiftMultiplier: 1.5,
    nightShiftMultiplier: 2.0,
    holidayMultiplier: 3.0,
    overtimeMultiplier: 1.5,
    allowances: []
  };
}

export default {
  calculateDailySalary,
  calculateMonthlySummary,
  getDefaultSalaryConfig
};
