import mongoose, { Document, Schema } from 'mongoose';

export interface IInvestment extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'stock' | 'crypto' | 'bond' | 'mutual_fund' | 'real_estate' | 'other';
  symbol?: string;
  coinId?: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['stock', 'crypto', 'bond', 'mutual_fund', 'real_estate', 'other'],
    required: true
  },
  symbol: { type: String },
  coinId: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, required: true, min: 0 },
  currentPrice: { type: Number, required: true, min: 0 },
  purchaseDate: { type: Date, required: true },
  notes: { type: String }
}, { timestamps: true });

InvestmentSchema.index({ userId: 1, type: 1 });
InvestmentSchema.index({ userId: 1, coinId: 1 });

export const Investment = mongoose.model<IInvestment>('Investment', InvestmentSchema);
