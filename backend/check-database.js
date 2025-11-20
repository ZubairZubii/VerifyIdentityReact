const User = require('./models/user_model');
const FormSubmission = require('./models/forms_model');
const connectDB = require('./db');

async function checkDatabase() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Check users
    console.log('\n👥 Checking users...');
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`Active users: ${activeUsers}`);
    console.log(`Pending users: ${pendingUsers}`);
    console.log(`Suspended users: ${suspendedUsers}`);

    // Check form submissions
    console.log('\n📋 Checking form submissions...');
    const totalSubmissions = await FormSubmission.countDocuments();
    const residentialSubmissions = await FormSubmission.countDocuments({ formType: 'residential' });
    const commercialSubmissions = await FormSubmission.countDocuments({ formType: 'commercial' });
    const autoSubmissions = await FormSubmission.countDocuments({ formType: 'auto' });
    
    const submittedStatus = await FormSubmission.countDocuments({ status: 'submitted' });
    const processingStatus = await FormSubmission.countDocuments({ status: 'processing' });
    const completedStatus = await FormSubmission.countDocuments({ status: 'completed' });
    const approvedStatus = await FormSubmission.countDocuments({ status: 'approved' });
    const rejectedStatus = await FormSubmission.countDocuments({ status: 'rejected' });
    
    console.log(`Total submissions: ${totalSubmissions}`);
    console.log(`Residential: ${residentialSubmissions}`);
    console.log(`Commercial: ${commercialSubmissions}`);
    console.log(`Auto: ${autoSubmissions}`);
    console.log(`Submitted: ${submittedStatus}`);
    console.log(`Processing: ${processingStatus}`);
    console.log(`Completed: ${completedStatus}`);
    console.log(`Approved: ${approvedStatus}`);
    console.log(`Rejected: ${rejectedStatus}`);

    // Get recent submissions
    console.log('\n📊 Recent submissions...');
    const recentSubmissions = await FormSubmission.find()
      .sort({ submittedAt: -1 })
      .limit(5)
      .select('fullName email formType status submittedAt');
    
    console.log(`Recent submissions (${recentSubmissions.length}):`);
    recentSubmissions.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.fullName} (${sub.email}) - ${sub.formType} - ${sub.status}`);
    });

    // Get recent users
    console.log('\n👤 Recent users...');
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role status createdAt');
    
    console.log(`Recent users (${recentUsers.length}):`);
    recentUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
    });

    console.log('\n✅ Database check completed!');
    
    if (totalUsers === 0 || totalSubmissions === 0) {
      console.log('\n⚠️  No data found. Run "node seed-test-data.js" to add test data.');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkDatabase();

