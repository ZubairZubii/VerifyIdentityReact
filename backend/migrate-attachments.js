const FormSubmission = require('./models/forms_model');
const connectDB = require('./db');

async function migrateAttachments() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find submissions with attachments in the old 'files' field
    console.log('\n🔍 Looking for submissions with attachments in old format...');
    const submissionsToMigrate = await FormSubmission.find({
      files: { $exists: true, $ne: {} }
    });

    if (submissionsToMigrate.length === 0) {
      console.log('✅ No submissions found with old attachment format');
      return;
    }

    console.log(`📋 Found ${submissionsToMigrate.length} submissions to migrate`);

    // Migrate each submission
    for (const submission of submissionsToMigrate) {
      console.log(`\n🔄 Migrating submission: ${submission._id}`);
      console.log(`   Name: ${submission.fullName}`);
      
      let updated = false;
      const updateData = {};

      // Check each attachment field
      const attachmentFields = ['licenseFront', 'licenseBack', 'proofOfResidency', 'registration', 'licensePlate', 'insuranceProof'];
      
      attachmentFields.forEach(field => {
        if (submission.files && submission.files[field]) {
          // Move from files.field to individual field
          updateData[field] = submission.files[field];
          console.log(`   ✅ Moving ${field}: ${submission.files[field].originalname || submission.files[field].filename}`);
          updated = true;
        }
      });

      if (updated) {
        // Update the submission
        await FormSubmission.findByIdAndUpdate(submission._id, updateData);
        console.log(`   ✅ Successfully migrated submission ${submission._id}`);
      } else {
        console.log(`   ⚠️  No attachments found in files field for ${submission._id}`);
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
          console.log(`   ✅ ${field}: ${submission[field].originalname || submission[field].filename}`);
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
migrateAttachments();

