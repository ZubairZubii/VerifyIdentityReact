const FormSubmission = require('./models/forms_model');
const connectDB = require('./db');

async function debugDataFlow() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Get all submissions
    console.log('\n📋 Checking all submissions in database...');
    const allSubmissions = await FormSubmission.find().sort({ createdAt: -1 });
    
    if (allSubmissions.length === 0) {
      console.log('❌ No submissions found in database');
      return;
    }

    console.log(`✅ Found ${allSubmissions.length} total submissions`);

    // Check the most recent submission in detail
    const mostRecent = allSubmissions[0];
    console.log(`\n🔍 DETAILED ANALYSIS of most recent submission (${mostRecent._id}):`);
    console.log('=' * 80);
    
    // Show all fields in the submission
    console.log('\n📊 ALL FIELDS IN SUBMISSION:');
    const allFields = Object.keys(mostRecent.toObject());
    allFields.forEach(field => {
      const value = mostRecent[field];
      if (value === null || value === undefined) {
        console.log(`   ${field}: null/undefined`);
      } else if (typeof value === 'object') {
        console.log(`   ${field}: [OBJECT] - ${JSON.stringify(value, null, 2)}`);
      } else {
        console.log(`   ${field}: ${value}`);
      }
    });

    // Check specifically for attachment fields
    console.log('\n📎 CHECKING ATTACHMENT FIELDS:');
    const attachmentFields = ['licenseFront', 'licenseBack', 'proofOfResidency', 'registration', 'licensePlate', 'insuranceProof'];
    
    attachmentFields.forEach(field => {
      console.log(`\n   ${field}:`);
      const value = mostRecent[field];
      if (value) {
        console.log(`     ✅ Field exists`);
        console.log(`     Type: ${typeof value}`);
        console.log(`     Value: ${JSON.stringify(value, null, 4)}`);
        
        if (value.originalname) {
          console.log(`     Original Name: ${value.originalname}`);
        }
        if (value.size) {
          console.log(`     Size: ${value.size} bytes`);
        }
        if (value.mimetype) {
          console.log(`     MIME Type: ${value.mimetype}`);
        }
        if (value.data) {
          console.log(`     Data Length: ${value.data.length} characters`);
          console.log(`     Data Preview: ${value.data.substring(0, 50)}...`);
        }
      } else {
        console.log(`     ❌ Field is null/undefined`);
      }
    });

    // Check if there's a 'files' field (old format)
    console.log('\n📁 CHECKING FOR OLD "files" FIELD:');
    if (mostRecent.files) {
      console.log('   ✅ "files" field exists');
      console.log(`   Type: ${typeof mostRecent.files}`);
      console.log(`   Value: ${JSON.stringify(mostRecent.files, null, 2)}`);
    } else {
      console.log('   ❌ No "files" field found');
    }

    // Test the getSubmissionById function
    console.log('\n🧪 TESTING getSubmissionById FUNCTION:');
    try {
      const submissionById = await FormSubmission.findById(mostRecent._id);
      if (submissionById) {
        console.log('   ✅ getSubmissionById works');
        console.log('   Fields returned:', Object.keys(submissionById.toObject()));
        
        // Check attachment fields in the returned data
        attachmentFields.forEach(field => {
          if (submissionById[field]) {
            console.log(`   ✅ ${field}: ${submissionById[field].originalname || 'No originalname'}`);
          } else {
            console.log(`   ❌ ${field}: Not found`);
          }
        });
      } else {
        console.log('   ❌ getSubmissionById returned null');
      }
    } catch (error) {
      console.log('   ❌ Error in getSubmissionById:', error.message);
    }

    // Check the database schema
    console.log('\n📋 CHECKING DATABASE SCHEMA:');
    try {
      const schema = FormSubmission.schema;
      console.log('   Schema paths:');
      schema.eachPath((path, schemaType) => {
        console.log(`     ${path}: ${schemaType.instance}`);
      });
    } catch (error) {
      console.log('   ❌ Error checking schema:', error.message);
    }

    // Test what the frontend API would return
    console.log('\n🌐 TESTING FRONTEND API RESPONSE:');
    try {
      const apiResponse = {
        success: true,
        data: {
          _id: mostRecent._id,
          fullName: mostRecent.fullName,
          email: mostRecent.email,
          formType: mostRecent.formType,
          licenseFront: mostRecent.licenseFront,
          licenseBack: mostRecent.licenseBack,
          proofOfResidency: mostRecent.proofOfResidency,
          registration: mostRecent.registration,
          licensePlate: mostRecent.licensePlate,
          insuranceProof: mostRecent.insuranceProof
        }
      };
      
      console.log('   API Response structure:');
      console.log(`   Success: ${apiResponse.success}`);
      console.log(`   Data keys: ${Object.keys(apiResponse.data)}`);
      
      attachmentFields.forEach(field => {
        if (apiResponse.data[field]) {
          console.log(`   ✅ ${field}: Present in API response`);
        } else {
          console.log(`   ❌ ${field}: Missing from API response`);
        }
      });
      
    } catch (error) {
      console.log('   ❌ Error creating API response:', error.message);
    }

    console.log('\n✅ Data flow debugging completed!');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    process.exit(0);
  }
}

// Run the debug
debugDataFlow();

