import mongoose, { Document, Schema } from 'mongoose';

export interface IDebt extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  paidAmount: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: Date;
  endDate?: Date;
  lender: string;
  status: 'active' | 'paid' | 'overdue';
  paymentHistory: Array<{
    date: Date;
    amount: number;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DebtSchema = new Schema<IDebt>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  remainingAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  interestRate: { type: Number, default: 0 },
  monthlyPayment: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  lender: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['active', 'paid', 'overdue'],
    default: 'active'
  },
  paymentHistory: [{
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    note: { type: String }
  }]
}, { timestamps: true });

DebtSchema.index({ userId: 1, status: 1 });

export const Debt = mongoose.model<IDebt>('Debt', DebtSchema);
