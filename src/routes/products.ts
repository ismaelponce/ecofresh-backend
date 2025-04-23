import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken as authenticateUser, validateRequest } from '../middleware/auth.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create a new product - requires authentication
router.post(
  '/',
  authenticateUser,
  [
    body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description').notEmpty().withMessage('Description is required').trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').notEmpty().withMessage('Category is required').trim(),
    body('location.coordinates').isArray().withMessage('Coordinates must be an array [longitude, latitude]'),
    body('location.coordinates.*').isFloat().withMessage('Coordinates must be valid numbers'),
    body('location.address').notEmpty().withMessage('Address is required').trim(),
    body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
    body('images.*').isString().withMessage('Images must be valid strings'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      console.log('Creating product with data:', req.body);
      const userId = req.user?.id;
      
      // Check if user exists
      const user = await User.findOne({ firebaseUid: req.user?.uid });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create new product with the authenticated user as seller
      const product = new Product({
        ...req.body,
        seller: user._id,
      });

      await product.save();
      
      res.status(201).json({ 
        message: 'Product created successfully',
        product: {
          ...product.toObject(),
          seller: { 
            _id: user._id,
            name: user.name
          }
        }
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Failed to create product' });
    }
  }
);

// Get all products with filtering, sorting, and pagination
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('category').optional().isString().trim(),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a positive number'),
    query('sort').optional().isIn(['price_asc', 'price_desc', 'date_asc', 'date_desc']).withMessage('Invalid sort parameter'),
    query('lat').optional().isFloat().withMessage('Latitude must be a number'),
    query('lng').optional().isFloat().withMessage('Longitude must be a number'),
    query('distance').optional().isInt({ min: 1 }).withMessage('Distance must be a positive integer'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      
      // Build the filter object
      const filter: any = { status: 'active' };
      
      if (req.query.category) {
        filter.category = req.query.category;
      }
      
      if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) {
          filter.price.$gte = parseFloat(req.query.minPrice as string);
        }
        if (req.query.maxPrice) {
          filter.price.$lte = parseFloat(req.query.maxPrice as string);
        }
      }
      
      // Add geospatial query if coordinates provided
      if (req.query.lat && req.query.lng) {
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        const distance = parseInt(req.query.distance as string) || 10; // Default 10km
        
        filter['location.coordinates'] = {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: distance * 1000 // Convert km to meters
          }
        };
      }
      
      // Build sort object
      let sort: any = { createdAt: -1 }; // Default: newest first
      
      if (req.query.sort) {
        switch (req.query.sort) {
          case 'price_asc':
            sort = { price: 1 };
            break;
          case 'price_desc':
            sort = { price: -1 };
            break;
          case 'date_asc':
            sort = { createdAt: 1 };
            break;
          case 'date_desc':
            sort = { createdAt: -1 };
            break;
        }
      }
      
      // Query products with pagination
      const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('seller', 'name');
      
      // Get total count for pagination
      const total = await Product.countDocuments(filter);
      
      res.status(200).json({
        products,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  }
);

// Get a single product by ID
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id)
        .populate('seller', 'name email firebaseUid');
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.status(200).json({ product });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  }
);

// Update a product - requires authentication and ownership
router.put(
  '/:id',
  authenticateUser,
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty').trim().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty').trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty').trim(),
    body('location.coordinates').optional().isArray().withMessage('Coordinates must be an array [longitude, latitude]'),
    body('location.coordinates.*').optional().isFloat().withMessage('Coordinates must be valid numbers'),
    body('location.address').optional().notEmpty().withMessage('Address cannot be empty').trim(),
    body('images').optional().isArray({ min: 1 }).withMessage('At least one image is required'),
    body('images.*').optional().isString().withMessage('Images must be valid strings'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('status').optional().isIn(['active', 'sold', 'inactive']).withMessage('Invalid status'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Find the user by firebase UID
      const user = await User.findOne({ firebaseUid: req.user?.uid });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Find the product
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Check if the user is the seller
      if (product.seller.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to update this product' });
      }
      
      // Update the product
      Object.keys(req.body).forEach(key => {
        if (key !== 'seller') { // Don't allow changing the seller
          product[key] = req.body[key];
        }
      });
      
      await product.save();
      
      res.status(200).json({ 
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  }
);

// Delete a product - requires authentication and ownership
router.delete(
  '/:id',
  authenticateUser,
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Find the user by firebase UID
      const user = await User.findOne({ firebaseUid: req.user?.uid });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Find the product
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Check if the user is the seller
      if (product.seller.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to delete this product' });
      }
      
      // Delete the product (or mark as inactive if you want to keep records)
      product.status = 'inactive';
      await product.save();
      
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  }
);

// Get products by seller
router.get(
  '/user/:userId',
  [
    param('userId').notEmpty().withMessage('User ID is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      let userId = req.params.userId;
      let user;
      
      // Check if the ID is a Firebase UID or MongoDB ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
      
      if (!isValidObjectId) {
        // If it's not a valid ObjectId, assume it's a Firebase UID
        user = await User.findOne({ firebaseUid: userId });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        userId = user._id;
      }
      
      const products = await Product.find({ 
        seller: userId,
        status: 'active' 
      }).sort({ createdAt: -1 });
      
      res.status(200).json({ products });
    } catch (error) {
      console.error('Error fetching user products:', error);
      res.status(500).json({ message: 'Failed to fetch user products' });
    }
  }
);

// Export the router
export default router; 