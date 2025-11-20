const User = require('../models/user_model');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Email configuration
const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: 'bilalsonofkhirsheed@gmail.com',
    pass: 'xvja fncq vhjo puej'
  }
};

const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper function to send welcome email
const sendWelcomeEmail = async (user) => {
  try {
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: user.email,
      subject: 'Welcome to Verify Identity Network!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 2rem;">Welcome to Our Network!</h1>
          </div>
          
          <div style="background: white; padding: 2rem; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 1rem;">Hello ${user.name}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 1.5rem;">
              Thank you for joining our identity verification network. Your account has been created successfully and is currently under review.
            </p>
            
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
              <h3 style="color: #8b5cf6; margin-top: 0;">Account Details:</h3>
              <p style="margin: 0.5rem 0;"><strong>Name:</strong> ${user.name}</p>
              <p style="margin: 0.5rem 0;"><strong>Email:</strong> ${user.email}</p>
              <p style="margin: 0.5rem 0;"><strong>Company:</strong> ${user.companyName || 'Not provided'}</p>
              <p style="margin: 0.5rem 0;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: 600;">Pending Review</span></p>
            </div>
            
            <div style="background: #e0e7ff; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
              <h3 style="color: #3730a3; margin-top: 0;">What's Next?</h3>
              <ul style="color: #4338ca; margin: 0; padding-left: 1.5rem;">
                <li>Our team will review your application within 24-48 hours</li>
                <li>You'll receive an email notification once approved</li>
                <li>Start using our identity verification services</li>
                <li>Access your dashboard and manage your account</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="http://localhost:5174/VerifyIdentityReact/#/login" 
                 style="background: #8b5cf6; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Access Your Account
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem; text-align: center;">
              <p style="color: #9ca3af; font-size: 0.9rem; margin: 0;">
                If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const {
        name,
        email,
        phoneNumber,
        password,
        companyName,
        businessIndustry,
        companySize,
        website,
        description
      } = req.body;

      // Validate required fields
      if (!name || !email || !phoneNumber || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, phone number, and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new user
      const userData = {
        name,
        email,
        phoneNumber,
        password,
        companyName,
        businessIndustry,
        companySize,
        website,
        description,
        status: 'pending' // New users start as pending
      };

      const user = new User(userData);
      await user.save();

      // Generate JWT token
      const token = generateToken(user._id);

      // Send welcome email
      await sendWelcomeEmail(user);

      // Remove password from response
      const userResponse = user.toJSON();

      res.status(201).json({
        success: true,
        message: 'Account created successfully! Please check your email for further instructions.',
        user: userResponse,
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating account',
        error: error.message
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await user.updateLastLogin();

      // Generate JWT token
      const token = generateToken(user._id);

      // Remove password from response
      const userResponse = user.toJSON();

      res.json({
        success: true,
        message: 'Login successful',
        user: userResponse,
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during login',
        error: error.message
      });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching profile',
        error: error.message
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const {
        name,
        phoneNumber,
        companyName,
        businessIndustry,
        companySize,
        website,
        description
      } = req.body;

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update fields
      if (name) user.name = name;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (companyName) user.companyName = companyName;
      if (businessIndustry) user.businessIndustry = businessIndustry;
      if (companySize) user.companySize = companySize;
      if (website) user.website = website;
      if (description) user.description = description;

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: error.message
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing password',
        error: error.message
      });
    }
  },

  // Logout (client-side token removal)
  logout: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during logout',
        error: error.message
      });
    }
  },

  // Admin: Get all users
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      
      let query = {};
      if (status) query.status = status;
      if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
          { name: regex },
          { email: regex },
          { companyName: regex }
        ];
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }
  },

  // Admin: Update user status
  updateUserStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!['pending', 'active', 'suspended', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.status = status;
      await user.save();

      res.json({
        success: true,
        message: 'User status updated successfully',
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user status',
        error: error.message
      });
    }
  },

  // Get user statistics
  getUserStats: async (req, res) => {
    try {
      const stats = await User.getUserStats();
      const totalUsers = await User.countDocuments();
      const recentUsers = await User.getRecentUsers();
      const activeUsers = await User.countDocuments({ status: 'active' });
      const pendingUsers = await User.countDocuments({ status: 'pending' });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          pendingUsers,
          statsByStatus: stats,
          recentUsers
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics',
        error: error.message
      });
    }
  }
};

module.exports = authController;
