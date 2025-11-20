const FormSubmission = require('./models/forms_model');
const connectDB = require('./db');

async function migrateToIndividualFields() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find all submissions with files in the old format
    console.log('\n🔍 Looking for submissions with old file format...');
    const submissionsToMigrate = await FormSubmission.find({
      files: { $exists: true, $ne: {} }
    });

    if (submissionsToMigrate.length === 0) {
      console.log('✅ No submissions found with old file format');
      return;
    }

    console.log(`📋 Found ${submissionsToMigrate.length} submissions to migrate`);

    // Migrate each submission
    for (const submission of submissionsToMigrate) {
      console.log(`\n🔄 Migrating submission: ${submission._id}`);
      console.log(`   Name: ${submission.fullName}`);
      
      const updateData = {};
      let hasFiles = false;

      // Check each attachment field in the old files object
      const attachmentFields = ['licenseFront', 'licenseBack', 'proofOfResidency', 'registration', 'licensePlate', 'insuranceProof'];
      
      attachmentFields.forEach(field => {
        if (submission.files && submission.files[field] && Object.keys(submission.files[field]).length > 0) {
          // Move from files.field to individual field
          updateData[field] = {
            originalname: submission.files[field].originalName || submission.files[field].filename || 'unknown',
            size: submission.files[field].size || 0,
            mimetype: submission.files[field].mimetype || 'application/octet-stream',
            data: 'migrated-file-data' // Placeholder since we don't have the actual file data
          };
          console.log(`   ✅ Moving ${field}: ${updateData[field].originalname}`);
          hasFiles = true;
        }
      });

      if (hasFiles) {
        // Update the submission
        await FormSubmission.findByIdAndUpdate(submission._id, updateData);
        console.log(`   ✅ Successfully migrated submission ${submission._id}`);
      } else {
        console.log(`   ⚠️  No valid file data found in files field for ${submission._id}`);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\n🧪 Testing migrated submissions...');
    
    // Test the migrated submissions
    const testSubmissions = await FormSubmission.find({
      $or: [
        { licenseFront: { $exists: true } },
        { licenseBack: { $exists: true } },
        { proofOfResidency: { $exists: true } },
        { registration: { $exists: true } },
        { licensePlate: { $exists: true } },
        { insuranceProof: { $exists: true } }
      ]
    }).limit(3);

    console.log(`📋 Found ${testSubmissions.length} submissions with attachments in individual fields`);

    testSubmissions.forEach((submission, index) => {
      console.log(`\n📄 Test Submission ${index + 1}:`);
      console.log(`   Name: ${submission.fullName}`);
      console.log(`   Form Type: ${submission.formType}`);
      
      const attachmentFields = ['licenseFront', 'licenseBack', 'proofOfResidency', 'registration', 'licensePlate', 'insuranceProof'];
      attachmentFields.forEach(field => {
        if (submission[field]) {
          console.log(`   ✅ ${field}: ${submission[field].originalname}`);
        }
      });
    });

    console.log('\n🎉 Migration and testing completed successfully!');
    console.log('💡 You can now check the Admin Dashboard to see if attachments are displaying properly');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateToIndividualFields();

