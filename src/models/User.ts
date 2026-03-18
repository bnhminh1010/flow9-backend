import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  pin: string;
  name: string;
  settings: {
    currency: string;
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  pin: { type: String, required: true },
  name: { type: String, default: 'Admin' },
  settings: {
    currency: { type: String, default: 'VND' },
    timezone: { type: String, default: 'Asia/Ho_Chi_Minh' }
  }
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
