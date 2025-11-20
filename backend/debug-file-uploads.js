const FormSubmission = require('./models/forms_model');
const connectDB = require('./db');
const fs = require('fs');
const path = require('path');

async function debugFileUploads() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Check uploads directory
    console.log('\n📁 Checking uploads directory...');
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`✅ Uploads directory exists with ${files.length} files:`);
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   📄 ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
      });
    } else {
      console.log('❌ Uploads directory does not exist!');
    }

    // Check recent submissions
    console.log('\n📋 Checking recent submissions...');
    const recentSubmissions = await FormSubmission.find()
      .sort({ createdAt: -1 })
      .limit(5);

    if (recentSubmissions.length === 0) {
      console.log('❌ No submissions found in database');
      return;
    }

    console.log(`✅ Found ${recentSubmissions.length} recent submissions`);

    // Analyze each submission
    recentSubmissions.forEach((submission, index) => {
      console.log(`\n📄 Submission ${index + 1} (${submission._id}):`);
      console.log(`   Name: ${submission.fullName}`);
      console.log(`   Email: ${submission.email}`);
      console.log(`   Form Type: ${submission.formType}`);
      console.log(`   Created: ${submission.createdAt}`);
      console.log(`   Updated: ${submission.updatedAt}`);
      
      // Check for attachments in individual fields
      const attachmentFields = ['licenseFront', 'licenseBack', 'proofOfResidency', 'registration', 'licensePlate', 'insuranceProof'];
      let hasIndividualAttachments = false;
      
      console.log('   📎 Individual field attachments:');
      attachmentFields.forEach(field => {
        if (submission[field]) {
          hasIndividualAttachments = true;
          console.log(`     ✅ ${field}:`);
          console.log(`        Original Name: ${submission[field].originalname || 'N/A'}`);
          console.log(`        Filename: ${submission[field].filename || 'N/A'}`);
          console.log(`        Path: ${submission[field].path || 'N/A'}`);
          console.log(`        Size: ${submission[field].size || 'N/A'} bytes`);
          console.log(`        MIME Type: ${submission[field].mimetype || 'N/A'}`);
          
          // Check if file actually exists
          if (submission[field].path && fs.existsSync(submission[field].path)) {
            console.log(`        ✅ File exists on disk`);
          } else {
            console.log(`        ❌ File does NOT exist on disk`);
          }
        }
      });
      
      if (!hasIndividualAttachments) {
        console.log('     ❌ No attachments found in individual fields');
      }
      
      // Check for attachments in old 'files' field
      if (submission.files && Object.keys(submission.files).length > 0) {
        console.log('   📎 Old "files" field attachments:');
        Object.keys(submission.files).forEach(field => {
          const file = submission.files[field];
          console.log(`     ⚠️  ${field}: ${file.originalname || file.filename || 'File present'}`);
        });
      }
      
      // Check for any other file-related fields
      const allFields = Object.keys(submission.toObject());
      const fileRelatedFields = allFields.filter(field => 
        field.includes('file') || field.includes('File') || 
        field.includes('attachment') || field.includes('Attachment')
      );
      
      if (fileRelatedFields.length > 0) {
        console.log('   📎 Other file-related fields:');
        fileRelatedFields.forEach(field => {
          console.log(`     ℹ️  ${field}: ${submission[field] ? 'Has data' : 'Empty'}`);
        });
      }
    });

    // Check the most recent submission in detail
    const mostRecent = recentSubmissions[0];
    console.log(`\n🔍 Detailed analysis of most recent submission (${mostRecent._id}):`);
    console.log('Full submission object keys:', Object.keys(mostRecent.toObject()));
    
    // Check if this submission has any file data at all
    const hasAnyFileData = Object.keys(mostRecent.toObject()).some(key => {
      const value = mostRecent[key];
      return value && typeof value === 'object' && 
             (value.originalname || value.filename || value.path);
    });
    
    if (hasAnyFileData) {
      console.log('✅ Submission has some file data');
    } else {
      console.log('❌ Submission has NO file data at all');
    }

    console.log('\n✅ Debug analysis completed!');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    process.exit(0);
  }
}

// Run the debug
debugFileUploads();

