import mongoose, { Document, Schema } from 'mongoose';

export interface IRecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  endDate?: Date;
  nextRunDate: Date;
}

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  categoryId?: mongoose.Types.ObjectId;
  description: string;
  date: Date;
  tags?: string[];
  attachments?: string[];
  isRecurring: boolean;
  recurringConfig?: IRecurringConfig;
  paymentHistory?: Array<{
    date: Date;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    transactionId?: mongoose.Types.ObjectId;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  tags: [{ type: String }],
  attachments: [{ type: String }],
  isRecurring: { type: Boolean, default: false },
  recurringConfig: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    endDate: { type: Date },
    nextRunDate: { type: Date }
  }
}, { timestamps: true });

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
