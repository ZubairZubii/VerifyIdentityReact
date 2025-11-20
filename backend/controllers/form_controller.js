const FormSubmission = require('../models/forms_model');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Email configuration (you can move this to a separate config file)
const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: 'bilalsonofkhirsheed@gmail.com',
    pass: 'xvja fncq vhjo puej'
  }
};

const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Helper function to process file information
const processFileInfo = (files) => {
  const fileInfo = {};
  const fileFields = ['licenseFront', 'licenseBack', 'proofOfResidency', 'registration', 'licensePlate', 'insuranceProof'];
  
  fileFields.forEach(fieldName => {
    if (files[fieldName] && files[fieldName][0]) {
      const file = files[fieldName][0];
      fileInfo[fieldName] = {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        data: file.buffer.toString('base64') // Store file data as base64
      };
      console.log(`Processed file ${fieldName}:`, {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        dataLength: file.buffer.length
      });
    }
  });
  
  return fileInfo;
};

// Helper function to build user confirmation email content
const buildUserConfirmationEmail = (formData, formType, paymentAmount) => {
  const amount = paymentAmount ? (paymentAmount / 100).toFixed(2) : '50.00';
  
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
      <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background-color: #28a745; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px; font-weight: bold;">✓</span>
          </div>
          <h1 style="color: #333; margin: 0; font-size: 28px;">Payment Confirmed!</h1>
          <p style="color: #666; margin: 10px 0 0; font-size: 16px;">Your identity verification request has been received and payment processed successfully.</p>
        </div>
        
        <div style="background-color: #e8f5e8; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #155724; margin: 0 0 15px; font-size: 18px;">Payment Details</h3>
          <p style="margin: 5px 0; color: #155724;"><strong>Amount Paid:</strong> $${amount}</p>
          <p style="margin: 5px 0; color: #155724;"><strong>Payment Method:</strong> Google Pay / Apple Pay</p>
          <p style="margin: 5px 0; color: #155724;"><strong>Transaction Date:</strong> ${new Date().toLocaleString()}</p>
          <p style="margin: 5px 0; color: #155724;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">COMPLETED</span></p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px; font-size: 18px;">Your Verification Request</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Form Type:</strong> ${formType.toUpperCase()}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Full Name:</strong> ${formData.fullName}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${formData.email}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${formData.phoneNumber || 'Not provided'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Address:</strong> ${formData.address || 'Not provided'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Birth Date:</strong> ${formData.birthDate || 'Not provided'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>AAA Membership ID:</strong> ${formData.aaaMembershipId || 'Not provided'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Insurance Policy Number:</strong> ${formData.insurancePolicyNumber || 'Not provided'}</p>
  `;

  // Add form-specific fields
  if (formType === 'residential' || formType === 'commercial') {
    htmlContent += `
      <p style="margin: 5px 0; color: #666;"><strong>Property Type:</strong> ${formData.propertyType || 'Not provided'}</p>
      <p style="margin: 5px 0; color: #666;"><strong>Property Address:</strong> ${formData.propertyAddress || 'Not provided'}</p>
    `;
  }

  if (formType === 'auto') {
    htmlContent += `
      <p style="margin: 5px 0; color: #666;"><strong>VIN:</strong> ${formData.vin || 'Not provided'}</p>
    `;
  }

  if (formData.ownerType === 'other') {
    htmlContent += `
      <p style="margin: 5px 0; color: #666;"><strong>Owner's Name:</strong> ${formData.ownerFullName || 'Not provided'}</p>
      <p style="margin: 5px 0; color: #666;"><strong>Owner's Phone:</strong> ${formData.ownerPhone || 'Not provided'}</p>
    `;
  }

  htmlContent += `
          <p style="margin: 5px 0; color: #666;"><strong>Tech ID:</strong> ${formData.techId || 'Not provided'}</p>
        </div>
        
        <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #0c5460; margin: 0 0 15px; font-size: 18px;">What Happens Next?</h3>
          <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
            <li style="margin: 8px 0;">Your documents are being reviewed by our verification team</li>
            <li style="margin: 8px 0;">Processing typically takes 2-3 business days</li>
            <li style="margin: 8px 0;">You will receive an email notification once verification is complete</li>
            <li style="margin: 8px 0;">If additional information is needed, we will contact you directly</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>Need Help?</strong><br>
            If you have any questions about your verification request, please contact us at 
            <a href="mailto:bilalsonofkhirsheed@gmail.com" style="color: #007bff; text-decoration: none;">bilalsonofkhirsheed@gmail.com</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #999; font-size: 12px;">
            This is an automated confirmation email. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;

  return htmlContent;
};

// Helper function to build email content
const buildEmailContent = (formData, formType, files) => {
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
        <p><strong>Insurance Policy Number:</strong> ${formData.insurancePolicyNumber || 'Not provided'}</p>
        <p><strong>Ownership:</strong> ${formData.ownerType || 'Not provided'}</p>
  `;

  // Add form-specific fields
  if (formType === 'residential' || formType === 'commercial') {
    htmlContent += `
      <p><strong>Property Type:</strong> ${formData.propertyType || 'Not provided'}</p>
      <p><strong>Property Address:</strong> ${formData.propertyAddress || 'Not provided'}</p>
    `;
  }

  if (formType === 'auto') {
    htmlContent += `
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
      <p><strong>Tech ID:</strong> ${formData.techId || 'Not provided'}</p>
      </div>
      
      <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #007bff; margin-top: 0;">Attached Files</h3>
  `;

  // List attached files
  const fileFields = ['licenseFront', 'licenseBack', 'proofOfResidency', 'registration', 'licensePlate', 'insuranceProof'];
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

  return htmlContent;
};

// Controller functions
const formController = {
  // Submit a new form
  submitForm: async (req, res) => {
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

      // Get form type
      const formType = Array.isArray(formData.form_type) ? formData.form_type[0] : (formData.form_type || 'residential');

      // Process file information and store in individual fields
      console.log('Processing files:', files);
      const fileInfo = processFileInfo(files);
      console.log('Processed file info:', fileInfo);

      // Create form submission object
      const submissionData = {
        formType: formType,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        birthDate: formData.birthDate,
        aaaMembershipId: formData.aaaMembershipId,
        insurancePolicyNumber: formData.insurancePolicyNumber,
        ownerType: formData.ownerType,
        techId: formData.techId,
        // Store files in individual fields for easy access
        licenseFront: fileInfo.licenseFront || null,
        licenseBack: fileInfo.licenseBack || null,
        proofOfResidency: fileInfo.proofOfResidency || null,
        registration: fileInfo.registration || null,
        licensePlate: fileInfo.licensePlate || null,
        insuranceProof: fileInfo.insuranceProof || null
      };
      
      console.log('Submission data with files:', {
        licenseFront: submissionData.licenseFront ? 'Present' : 'Missing',
        licenseBack: submissionData.licenseBack ? 'Present' : 'Missing',
        proofOfResidency: submissionData.proofOfResidency ? 'Present' : 'Missing',
        registration: submissionData.registration ? 'Present' : 'Missing',
        licensePlate: submissionData.licensePlate ? 'Present' : 'Missing',
        insuranceProof: submissionData.insuranceProof ? 'Present' : 'Missing'
      });

      // Add conditional fields based on form type
      if (formType === 'residential' || formType === 'commercial') {
        submissionData.propertyType = formData.propertyType;
        submissionData.propertyAddress = formData.propertyAddress;
      }

      if (formType === 'auto') {
        submissionData.vin = formData.vin;
      }

      if (formData.ownerType === 'other') {
        submissionData.ownerFullName = formData.ownerFullName;
        submissionData.ownerPhone = formData.ownerPhone;
      }

      // Save to MongoDB
      console.log('Attempting to save to MongoDB:', submissionData);
      const formSubmission = new FormSubmission(submissionData);
      const savedSubmission = await formSubmission.save();
      console.log('Successfully saved to MongoDB:', savedSubmission._id);

      // Send email
      try {
        const htmlContent = buildEmailContent(formData, formType, files);
        
        // Prepare attachments
        const attachments = [];
        const fileFields = ['licenseFront', 'licenseBack', 'proofOfResidency', 'registration', 'licensePlate', 'insuranceProof'];
        
        fileFields.forEach(fieldName => {
          if (files[fieldName] && files[fieldName][0]) {
            const file = files[fieldName][0];
            attachments.push({
              filename: file.originalname,
              content: file.buffer, // Use buffer for memory storage
              contentType: file.mimetype
            });
          }
        });

        const mailOptions = {
          from: EMAIL_CONFIG.auth.user,
          to: EMAIL_CONFIG.auth.user,
          subject: `New Identity Verification Form - ${formType.toUpperCase()}`,
          html: htmlContent,
          attachments: attachments
        };

        const info = await transporter.sendMail(mailOptions);
        
        // Update submission with email info
        savedSubmission.emailSent = true;
        savedSubmission.emailMessageId = info.messageId;
        await savedSubmission.save();

        console.log('Email sent successfully:', info.messageId);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the entire request if email fails
      }

      res.json({
        success: true,
        message: 'Form submitted successfully and saved to database',
        submissionId: savedSubmission._id,
        messageId: savedSubmission.emailMessageId
      });

    } catch (error) {
      console.error('Error processing form submission:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing form submission',
        error: error.message
      });
    }
  },

  // Get all form submissions
  getAllSubmissions: async (req, res) => {
    try {
      const { page = 1, limit = 10, formType, status } = req.query;
      
      const query = {};
      if (formType) query.formType = formType;
      if (status) query.status = status;

      const submissions = await FormSubmission.find(query)
        .sort({ submittedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-files'); // Exclude file data for list view

      const total = await FormSubmission.countDocuments(query);

      res.json({
        success: true,
        data: submissions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching submissions',
        error: error.message
      });
    }
  },

  // Get a specific form submission
  getSubmissionById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Fetching submission by ID:', id);
      
      const submission = await FormSubmission.findById(id);

      if (!submission) {
        console.log('Submission not found for ID:', id);
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      console.log('Found submission:', {
        id: submission._id,
        name: submission.fullName,
        email: submission.email,
        formType: submission.formType,
        attachmentFields: {
          licenseFront: submission.licenseFront ? 'Present' : 'Missing',
          licenseBack: submission.licenseBack ? 'Present' : 'Missing',
          proofOfResidency: submission.proofOfResidency ? 'Present' : 'Missing',
          registration: submission.registration ? 'Present' : 'Missing',
          licensePlate: submission.licensePlate ? 'Present' : 'Missing',
          insuranceProof: submission.insuranceProof ? 'Present' : 'Missing'
        }
      });

      res.json({
        success: true,
        data: submission
      });
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching submission',
        error: error.message
      });
    }
  },

  // Update submission status
  updateSubmissionStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const submission = await FormSubmission.findById(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      submission.status = status;
      if (adminNotes) submission.adminNotes = adminNotes;
      
      if (status === 'processing') {
        submission.processedAt = new Date();
      }

      await submission.save();

      res.json({
        success: true,
        message: 'Submission status updated successfully',
        data: submission
      });
    } catch (error) {
      console.error('Error updating submission:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating submission',
        error: error.message
      });
    }
  },

  // Get submission statistics
  getSubmissionStats: async (req, res) => {
    try {
      const stats = await FormSubmission.getSubmissionStats();
      const totalSubmissions = await FormSubmission.countDocuments();
      const recentSubmissions = await FormSubmission.find()
        .sort({ submittedAt: -1 })
        .limit(5)
        .select('fullName email formType status submittedAt');

      res.json({
        success: true,
        data: {
          totalSubmissions,
          statsByType: stats,
          recentSubmissions
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching statistics',
        error: error.message
      });
    }
  },

  // Get overview statistics
  getOverviewStats: async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Get current date and calculate date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Get total submissions
      const totalSubmissions = await FormSubmission.countDocuments();

      // Get submissions by status
      const pendingSubmissions = await FormSubmission.countDocuments({ status: 'submitted' });
      const processingSubmissions = await FormSubmission.countDocuments({ status: 'processing' });
      const completedSubmissions = await FormSubmission.countDocuments({ status: 'completed' });

      // Get submissions by form type
      const residentialSubmissions = await FormSubmission.countDocuments({ formType: 'residential' });
      const commercialSubmissions = await FormSubmission.countDocuments({ formType: 'commercial' });
      const autoSubmissions = await FormSubmission.countDocuments({ formType: 'auto' });

      // Get payment statistics
      const totalRevenue = await FormSubmission.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
      ]);

      const completedPayments = await FormSubmission.countDocuments({ paymentStatus: 'completed' });
      const pendingPayments = await FormSubmission.countDocuments({ paymentStatus: 'pending' });

      // Get recent activity (last 7 days)
      const recentSubmissions = await FormSubmission.countDocuments({
        createdAt: { $gte: thisWeek }
      });

      // Get this month vs last month
      const thisMonthSubmissions = await FormSubmission.countDocuments({
        createdAt: { $gte: thisMonth }
      });

      const lastMonthSubmissions = await FormSubmission.countDocuments({
        createdAt: { $gte: lastMonth, $lt: thisMonth }
      });

      // Calculate growth percentage
      const growthPercentage = lastMonthSubmissions > 0 
        ? ((thisMonthSubmissions - lastMonthSubmissions) / lastMonthSubmissions * 100).toFixed(1)
        : thisMonthSubmissions > 0 ? 100 : 0;

      const stats = {
        totalSubmissions,
        pendingSubmissions,
        processingSubmissions,
        completedSubmissions,
        residentialSubmissions,
        commercialSubmissions,
        autoSubmissions,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        completedPayments,
        pendingPayments,
        recentSubmissions,
        thisMonthSubmissions,
        lastMonthSubmissions,
        growthPercentage: parseFloat(growthPercentage)
      };

      console.log('Overview statistics calculated:', stats);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error fetching overview statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching statistics',
        error: error.message
      });
    }
  },

  // Download attachment
  downloadAttachment: async (req, res) => {
    try {
      const { id, fieldName } = req.params;
      
      // Find the submission
      const submission = await FormSubmission.findById(id);
      if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }

      // Check if the field exists and has data
      if (!submission[fieldName] || !submission[fieldName].data) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      const attachment = submission[fieldName];
      const originalName = attachment.originalname;
      const mimeType = attachment.mimetype || 'application/octet-stream';
      const base64Data = attachment.data;

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);

      // Send the file
      res.send(buffer);

      console.log(`Downloaded ${fieldName} for submission ${id}: ${originalName}`);

    } catch (error) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({ success: false, message: 'Error downloading attachment' });
    }
  },

  // Send confirmation email to user
  sendUserConfirmationEmail: async (submissionId) => {
    try {
      const submission = await FormSubmission.findById(submissionId);
      if (!submission) {
        console.error('Submission not found for confirmation email:', submissionId);
        return { success: false, error: 'Submission not found' };
      }

      const formData = {
        fullName: submission.fullName,
        email: submission.email,
        phoneNumber: submission.phoneNumber,
        address: submission.address,
        birthDate: submission.birthDate,
        aaaMembershipId: submission.aaaMembershipId,
        insurancePolicyNumber: submission.insurancePolicyNumber,
        ownerType: submission.ownerType,
        techId: submission.techId,
        propertyType: submission.propertyType,
        propertyAddress: submission.propertyAddress,
        vin: submission.vin,
        ownerFullName: submission.ownerFullName,
        ownerPhone: submission.ownerPhone
      };

      const htmlContent = buildUserConfirmationEmail(formData, submission.formType, submission.paymentAmount);

      const mailOptions = {
        from: `"Identity Verification Service" <${EMAIL_CONFIG.auth.user}>`,
        to: submission.email,
        subject: `Payment Confirmed - Identity Verification Request #${submissionId}`,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      
      // Update submission with confirmation email info
      submission.userConfirmationSent = true;
      submission.userConfirmationMessageId = info.messageId;
      await submission.save();

      console.log('User confirmation email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending user confirmation email:', error);
      return { success: false, error: error.message };
    }
  },

  // Update payment status
  updatePaymentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentIntentId, paymentAmount } = req.body;

      const submission = await FormSubmission.findById(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      submission.paymentStatus = paymentStatus;
      if (paymentIntentId) submission.paymentIntentId = paymentIntentId;
      if (paymentAmount) submission.paymentAmount = paymentAmount;

      await submission.save();

      // Send confirmation email to user if payment is completed
      if (paymentStatus === 'completed') {
        try {
          const emailResult = await formController.sendUserConfirmationEmail(id);
          if (emailResult.success) {
            console.log('User confirmation email sent for submission:', id);
          } else {
            console.error('Failed to send user confirmation email:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Error sending user confirmation email:', emailError);
        }
      }

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: submission
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating payment status',
        error: error.message
      });
    }
  }
};

module.exports = formController;
