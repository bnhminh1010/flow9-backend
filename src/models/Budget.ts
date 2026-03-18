import mongoose, { Document, Schema } from 'mongoose';

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'budget' | 'goal';
  category?: string;
  amount: number;
  spent?: number;
  currentAmount?: number;
  period?: 'weekly' | 'monthly' | 'yearly';
  deadline?: Date;
  alertThreshold: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['budget', 'goal'], required: true },
  category: { type: String },
  amount: { type: Number, required: true, min: 0 },
  spent: { type: Number, default: 0 },
  currentAmount: { type: Number, default: 0 },
  period: { type: String, enum: ['weekly', 'monthly', 'yearly'] },
  deadline: { type: Date },
  alertThreshold: { type: Number, default: 80 },
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' }
}, { timestamps: true });

BudgetSchema.index({ userId: 1, type: 1 });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
