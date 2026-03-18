import mongoose, { Document, Schema } from 'mongoose';

export interface IAllowance {
  name: string;
  amount: number;
}

export interface ISalaryConfig extends Document {
  userId: mongoose.Types.ObjectId;
  baseHourlyRate: number;
  dayShiftMultiplier: number;
  nightShiftMultiplier: number;
  holidayMultiplier: number;
  overtimeMultiplier: number;
  allowances: IAllowance[];
  updatedAt: Date;
}

const SalaryConfigSchema = new Schema<ISalaryConfig>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  baseHourlyRate: { type: Number, required: true, default: 50000 },
  dayShiftMultiplier: { type: Number, required: true, default: 1.5 },
  nightShiftMultiplier: { type: Number, required: true, default: 2.0 },
  holidayMultiplier: { type: Number, required: true, default: 3.0 },
  overtimeMultiplier: { type: Number, default: 1.5 },
  allowances: [{ name: String, amount: Number }]
}, { timestamps: true });

SalaryConfigSchema.index({ userId: 1 });

export const SalaryConfig = mongoose.model<ISalaryConfig>('SalaryConfig', SalaryConfigSchema);
