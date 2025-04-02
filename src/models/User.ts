import { Schema, model } from 'mongoose';

// Base interface without Document extension
export interface IUserBase {
  email: string;
  firebaseUid: string;
  name: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'admin';
  addresses: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Document interface
export interface IUser {
  email: string;
  firebaseUid: string;
  name: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'admin';
  addresses: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }[];
}

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer',
  },
  addresses: [{
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  }],
}, {
  timestamps: true,
});

export const User = model('User', userSchema); 