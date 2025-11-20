const User = require('./models/user_model');
const FormSubmission = require('./models/forms_model');
const connectDB = require('./db');

async function seedTestData() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🗑️ Clearing existing data...');
    await User.deleteMany({});
    await FormSubmission.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create test users
    console.log('\n👥 Creating test users...');
    const testUsers = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phoneNumber: '+1234567890',
        password: 'password123',
        companyName: 'Tech Solutions Inc.',
        businessIndustry: 'technology',
        companySize: '51-200',
        website: 'https://techsolutions.com',
        description: 'Leading technology company specializing in identity verification.',
        role: 'admin',
        status: 'active',
        isEmailVerified: true,
        lastLogin: new Date(),
        loginCount: 25
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phoneNumber: '+1234567891',
        password: 'password123',
        companyName: 'Real Estate Partners',
        businessIndustry: 'real-estate',
        companySize: '11-50',
        website: 'https://realestatepartners.com',
        description: 'Professional real estate services and property management.',
        role: 'partner',
        status: 'active',
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        loginCount: 12
      },
      {
        name: 'Mike Wilson',
        email: 'mike.wilson@example.com',
        phoneNumber: '+1234567892',
        password: 'password123',
        companyName: 'Healthcare Services LLC',
        businessIndustry: 'healthcare',
        companySize: '201-500',
        website: 'https://healthcareservices.com',
        description: 'Comprehensive healthcare and medical services.',
        role: 'user',
        status: 'pending',
        isEmailVerified: false,
        lastLogin: null,
        loginCount: 0
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        phoneNumber: '+1234567893',
        password: 'password123',
        companyName: 'Financial Advisors Group',
        businessIndustry: 'finance',
        companySize: '1-10',
        website: 'https://financialadvisors.com',
        description: 'Professional financial planning and investment services.',
        role: 'user',
        status: 'active',
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        loginCount: 8
      },
      {
        name: 'David Brown',
        email: 'david.brown@example.com',
        phoneNumber: '+1234567894',
        password: 'password123',
        companyName: 'Manufacturing Corp',
        businessIndustry: 'manufacturing',
        companySize: '500+',
        website: 'https://manufacturingcorp.com',
        description: 'Industrial manufacturing and production services.',
        role: 'user',
        status: 'suspended',
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
        loginCount: 45
      }
    ];

    const createdUsers = await User.insertMany(testUsers);
    console.log(`✅ Created ${createdUsers.length} test users`);

    // Create test form submissions
    console.log('\n📋 Creating test form submissions...');
    const testSubmissions = [
      {
        formType: 'residential',
        fullName: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        phoneNumber: '+1234567895',
        address: '123 Main Street, Anytown, ST 12345',
        birthDate: '01/15/1985',
        aaaMembershipId: 'AAA123456',
        insurancePolicyNumber: 'INS789012',
        ownerType: 'myself',
        propertyType: 'singleFamily',
        propertyAddress: '123 Main Street, Anytown, ST 12345',
        techId: 'TECH001',
        status: 'submitted',
        paymentStatus: 'pending',
        emailSent: true,
        submittedAt: new Date()
      },
      {
        formType: 'commercial',
        fullName: 'Bob Smith',
        email: 'bob.smith@example.com',
        phoneNumber: '+1234567896',
        address: '456 Business Ave, Citytown, ST 54321',
        birthDate: '03/22/1978',
        aaaMembershipId: 'AAA789012',
        insurancePolicyNumber: 'INS345678',
        ownerType: 'other',
        ownerFullName: 'Business Owner Inc.',
        ownerPhone: '+1234567897',
        propertyType: 'office',
        propertyAddress: '456 Business Ave, Citytown, ST 54321',
        techId: 'TECH002',
        status: 'processing',
        paymentStatus: 'completed',
        paymentAmount: 5000,
        emailSent: true,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        formType: 'auto',
        fullName: 'Carol Davis',
        email: 'carol.davis@example.com',
        phoneNumber: '+1234567898',
        address: '789 Auto Lane, Cartown, ST 67890',
        birthDate: '07/10/1990',
        aaaMembershipId: 'AAA345678',
        insurancePolicyNumber: 'INS901234',
        ownerType: 'myself',
        vin: '1HGBH41JXMN109186',
        techId: 'TECH003',
        status: 'approved',
        paymentStatus: 'completed',
        paymentAmount: 5000,
        emailSent: true,
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        formType: 'residential',
        fullName: 'Daniel Wilson',
        email: 'daniel.wilson@example.com',
        phoneNumber: '+1234567899',
        address: '321 Home Street, Hometown, ST 13579',
        birthDate: '12/05/1982',
        aaaMembershipId: 'AAA567890',
        insurancePolicyNumber: 'INS567890',
        ownerType: 'myself',
        propertyType: 'condo',
        propertyAddress: '321 Home Street, Hometown, ST 13579',
        techId: 'TECH004',
        status: 'completed',
        paymentStatus: 'completed',
        paymentAmount: 5000,
        emailSent: true,
        submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        formType: 'commercial',
        fullName: 'Eva Martinez',
        email: 'eva.martinez@example.com',
        phoneNumber: '+1234567800',
        address: '654 Commerce Blvd, Businesstown, ST 24680',
        birthDate: '09/18/1975',
        aaaMembershipId: 'AAA901234',
        insurancePolicyNumber: 'INS123456',
        ownerType: 'other',
        ownerFullName: 'Commercial Properties LLC',
        ownerPhone: '+1234567801',
        propertyType: 'retail',
        propertyAddress: '654 Commerce Blvd, Businesstown, ST 24680',
        techId: 'TECH005',
        status: 'rejected',
        paymentStatus: 'completed',
        paymentAmount: 5000,
        emailSent: true,
        submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      }
    ];

    const createdSubmissions = await FormSubmission.insertMany(testSubmissions);
    console.log(`✅ Created ${createdSubmissions.length} test form submissions`);

    // Display statistics
    console.log('\n📊 Database Statistics:');
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    
    const totalSubmissions = await FormSubmission.countDocuments();
    const submittedSubmissions = await FormSubmission.countDocuments({ status: 'submitted' });
    const processingSubmissions = await FormSubmission.countDocuments({ status: 'processing' });
    const completedSubmissions = await FormSubmission.countDocuments({ status: 'completed' });
    const approvedSubmissions = await FormSubmission.countDocuments({ status: 'approved' });
    const rejectedSubmissions = await FormSubmission.countDocuments({ status: 'rejected' });

    console.log(`👥 Users: ${totalUsers} total (${activeUsers} active, ${pendingUsers} pending, ${suspendedUsers} suspended)`);
    console.log(`📋 Submissions: ${totalSubmissions} total (${submittedSubmissions} submitted, ${processingSubmissions} processing, ${completedSubmissions} completed, ${approvedSubmissions} approved, ${rejectedSubmissions} rejected)`);

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('You can now check the Admin Dashboard to see the statistics.');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedTestData();


