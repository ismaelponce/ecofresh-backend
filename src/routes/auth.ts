import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Register new user
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('name').notEmpty().withMessage('Name is required'),
    body('firebaseUid').notEmpty().withMessage('Firebase UID is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, name, firebaseUid, phone } = req.body;

      // Check if user exists in our database
      let user = await User.findOne({ $or: [{ email }, { firebaseUid }] });
      
      if (user) {
        // If user exists with different firebaseUid, update it
        if (user.firebaseUid !== firebaseUid) {
          user.firebaseUid = firebaseUid;
          await user.save();
          return res.json({
            message: 'User firebaseUid updated successfully',
            user: {
              id: user._id,
              email: user.email,
              name: user.name,
              role: user.role,
            },
          });
        }
        
        return res.json({
          message: 'User already registered',
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        });
      }

      // Create new user
      user = new User({
        email,
        name,
        firebaseUid,
        phone,
        role: 'buyer', // Default role for new users
      });

      await user.save();

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    console.log('Fetching profile for UID:', req.user?.uid);
    
    let user = await User.findOne({ firebaseUid: req.user?.uid });
    
    // If user doesn't exist in our database but has valid Firebase auth,
    // create a basic profile automatically
    if (!user && req.user?.uid) {
      console.log('User not found in database, creating basic profile');
      
      // Create a basic user profile with data from Firebase auth
      user = new User({
        email: req.user.email || 'unknown@example.com',
        name: req.user.email ? req.user.email.split('@')[0] : 'User',
        firebaseUid: req.user.uid,
        role: 'buyer', // Default role
        addresses: [], // No addresses yet
      });
      
      try {
        await user.save();
        console.log('Basic profile created successfully');
      } catch (saveError) {
        console.error('Error creating basic profile:', saveError);
        // Continue even if save fails - we'll return the unsaved user object
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found and could not be created' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      addresses: user.addresses || [],
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 