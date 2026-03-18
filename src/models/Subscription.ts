import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentHistory {
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  transactionId?: mongoose.Types.ObjectId;
}

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  currency: 'VND' | 'USD';
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  nextBillingDate: Date;
  category: string;
  isActive: boolean;
  reminderDays: number;
  notified: boolean;
  lastNotifiedAt?: Date;
  paymentMethod?: string;
  notes?: string;
  paymentHistory: IPaymentHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['VND', 'USD'], default: 'VND' },
  billingCycle: { type: String, enum: ['weekly', 'monthly', 'yearly'], required: true },
  nextBillingDate: { type: Date, required: true },
  category: { type: String, default: 'Other' },
  isActive: { type: Boolean, default: true },
  reminderDays: { type: Number, default: 2 },
  notified: { type: Boolean, default: false },
  lastNotifiedAt: { type: Date },
  paymentMethod: { type: String },
  notes: { type: String },
  paymentHistory: [{
    date: Date,
    amount: Number,
    status: { type: String, enum: ['paid', 'pending', 'failed'] },
    transactionId: { type: Schema.Types.ObjectId }
  }]
}, { timestamps: true });

SubscriptionSchema.index({ userId: 1, isActive: 1, nextBillingDate: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
