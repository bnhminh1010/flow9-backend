import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkShift extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  shiftType: 'day' | 'night' | 'holiday';
  hourlyRate: number;
  dailySalary: number;
  isHoliday: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkShiftSchema = new Schema<IWorkShift>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  hours: { type: Number, required: true, min: 0 },
  shiftType: { type: String, enum: ['day', 'night', 'holiday'], required: true },
  hourlyRate: { type: Number, required: true },
  dailySalary: { type: Number, required: true },
  isHoliday: { type: Boolean, default: false },
  notes: { type: String }
}, { timestamps: true });

WorkShiftSchema.index({ userId: 1, date: -1 });

export const WorkShift = mongoose.model<IWorkShift>('WorkShift', WorkShiftSchema);
