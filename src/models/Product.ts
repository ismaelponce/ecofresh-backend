import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for a Product document
export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  category: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
  };
  images: string[]; // Array of image URLs
  quantity: number;
  seller: mongoose.Types.ObjectId; // Reference to User model
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'sold' | 'inactive';
}

// Define the schema for the Product model
const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: function(v: string[]) {
          return v.length > 0; // At least one image is required
        },
        message: 'At least one image is required',
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create a geospatial index for location-based queries
ProductSchema.index({ 'location.coordinates': '2dsphere' });

// Create the model from the schema and export it
export const Product = mongoose.model<IProduct>('Product', ProductSchema); 