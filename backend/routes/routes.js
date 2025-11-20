const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const formController = require('../controllers/form_controller');
const authController = require('../controllers/auth_controller');
const stripePayment = require('../StripePayment');
const { authenticateToken, requireAdmin, requireActiveAccount, optionalAuth } = require('../middleware/auth_middleware');

const router = express.Router();

// Configure multer for file uploads - store in memory and save to database
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image formats
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed!'));
    }
  }
});

// ===================
// AUTHENTICATION ROUTES
// ===================

// Register new user
router.post('/auth/register', authController.register);

// Login user
router.post('/auth/login', authController.login);

// Logout user
router.post('/auth/logout', authController.logout);

// Get current user profile
router.get('/auth/profile', authenticateToken, authController.getProfile);

// Update user profile
router.put('/auth/profile', authenticateToken, authController.updateProfile);

// Change password
router.put('/auth/change-password', authenticateToken, authController.changePassword);

// ===================
// USER MANAGEMENT ROUTES (Admin)
// ===================

// Get all users (Admin only)
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers);

// Update user status (Admin only)
router.put('/users/:userId/status', authenticateToken, requireAdmin, authController.updateUserStatus);

// Delete user (Admin only)
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const User = require('../models/user_model');
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Get user statistics (Admin only)
router.get('/stats/users', authenticateToken, requireAdmin, authController.getUserStats);

// ===================
// FORM ROUTES
// ===================

// Submit a new form
router.post('/submit-form', upload.fields([
  { name: 'licenseFront', maxCount: 1 },
  { name: 'licenseBack', maxCount: 1 },
  { name: 'proofOfResidency', maxCount: 1 },
  { name: 'registration', maxCount: 1 },
  { name: 'licensePlate', maxCount: 1 },
  { name: 'insuranceProof', maxCount: 1 }
]), formController.submitForm);

// Get all form submissions (with pagination and filtering)
router.get('/submissions', formController.getAllSubmissions);

// Get a specific form submission by ID
router.get('/submissions/:id', formController.getSubmissionById);

// Download attachment
router.get('/submissions/:id/download/:fieldName', formController.downloadAttachment);

// Update submission status
router.put('/submissions/:id/status', authenticateToken, requireAdmin, formController.updateSubmissionStatus);

// Update payment status for a submission
router.put('/submissions/:id/payment', formController.updatePaymentStatus);

// Delete a submission
router.delete('/submissions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const FormSubmission = require('../models/forms_model');
    
    const submission = await FormSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    await FormSubmission.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting submission',
      error: error.message
    });
  }
});

// Get submission statistics
router.get('/stats/submissions', authenticateToken, requireAdmin, formController.getSubmissionStats);

// Get overview statistics
router.get('/stats/overview', authenticateToken, requireAdmin, formController.getOverviewStats);

// Debug: Get all submissions (simple view)
router.get('/debug/submissions', async (req, res) => {
  try {
    const FormSubmission = require('../models/forms_model');
    const submissions = await FormSubmission.find()
      .sort({ submittedAt: -1 })
      .limit(10)
      .select('fullName email formType submittedAt status');
    
    res.json({
      success: true,
      count: submissions.length,
      submissions: submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================
// PAYMENT ROUTES
// ===================

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;
    
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    const result = await stripePayment.createPaymentIntent(amount, currency, metadata);
    
    if (result.success) {
      // Update submission with payment intent ID if submissionId is provided
      if (metadata.submissionId) {
        try {
          const FormSubmission = require('../models/forms_model');
          const submission = await FormSubmission.findById(metadata.submissionId);
          if (submission) {
            submission.paymentIntentId = result.paymentIntentId;
            submission.paymentAmount = amount;
            await submission.save();
          }
        } catch (updateError) {
          console.error('Error updating submission with payment intent:', updateError);
        }
      }
      
      res.json({
        success: true,
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creating payment intent',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in payment intent endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
});

// Retrieve payment intent
router.get('/payment-intent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await stripePayment.retrievePaymentIntent(id);
    
    if (result.success) {
      res.json({
        success: true,
        paymentIntent: result.paymentIntent
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error retrieving payment intent',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment intent',
      error: error.message
    });
  }
});

// Webhook endpoint for Stripe events
router.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

  try {
    const result = stripePayment.verifyWebhookSignature(req.body, sig, webhookSecret);
    
    if (result.success) {
      const event = result.event;
      
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await stripePayment.handleSuccessfulPayment(event.data.object);
          // You can also update the form submission payment status here
          break;
        case 'payment_intent.payment_failed':
          await stripePayment.handleFailedPayment(event.data.object);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } else {
      res.status(400).json({
        success: false,
        message: 'Webhook signature verification failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook error',
      error: error.message
    });
  }
});

// ===================
// UTILITY ROUTES
// ===================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Test MongoDB connection
router.get('/test-db', async (req, res) => {
  try {
    const FormSubmission = require('../models/forms_model');
    
    // Try to count documents
    const count = await FormSubmission.countDocuments();
    
    // Try to create a test document
    const testSubmission = new FormSubmission({
      formType: 'residential',
      fullName: 'Test User',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      address: 'Test Address',
      birthDate: '01/01/2000',
      aaaMembershipId: 'TEST123',
      insurancePolicyNumber: 'INS123',
      ownerType: 'myself',
      propertyType: 'singleFamily',
      propertyAddress: 'Test Property',
      techId: 'TECH123'
    });
    
    const saved = await testSubmission.save();
    
    res.json({
      success: true,
      message: 'MongoDB connection working',
      totalSubmissions: count,
      testDocumentId: saved._id
    });
  } catch (error) {
    console.error('MongoDB test error:', error);
    res.status(500).json({
      success: false,
      message: 'MongoDB connection failed',
      error: error.message
    });
  }
});

// Test email endpoint
router.post('/test-email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    
    const EMAIL_CONFIG = {
      service: 'gmail',
      auth: {
        user: 'bilalsonofkhirsheed@gmail.com',
        pass: 'xvja fncq vhjo puej'
      }
    };

    const transporter = nodemailer.createTransport(EMAIL_CONFIG);
    
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: EMAIL_CONFIG.auth.user,
      subject: 'Test Email from Verify Identity Backend',
      html: '<h2>Test Email</h2><p>This is a test email from the Verify Identity backend server.</p>'
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

// ===================
// ADMIN ROUTES (Future Enhancement)
// ===================

// Get all submissions for admin dashboard
router.get('/admin/submissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, formType, search } = req.query;
    
    let query = {};
    
    // Add filters
    if (status) query.status = status;
    if (formType) query.formType = formType;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { techId: { $regex: search, $options: 'i' } }
      ];
    }

    const FormSubmission = require('../models/forms_model');
    
    const submissions = await FormSubmission.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-files.licenseFront.buffer -files.licenseBack.buffer'); // Exclude file buffers

    const total = await FormSubmission.countDocuments(query);

    res.json({
      success: true,
      data: submissions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: error.message
    });
  }
});

// Export router
module.exports = router;
