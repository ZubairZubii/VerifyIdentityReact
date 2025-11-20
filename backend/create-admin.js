const mongoose = require('mongoose');
const User = require('./models/user_model');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/verifyIdentity', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@verifyidentity.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@verifyidentity.com',
      phoneNumber: '1234567890',
      password: 'admin123456', // This will be hashed automatically
      companyName: 'Verify Identity',
      businessIndustry: 'technology',
      companySize: '1-10',
      role: 'admin',
      status: 'active',
      isEmailVerified: true
    });

    await adminUser.save();
    console.log('Admin user created successfully:');
    console.log('Email: admin@verifyidentity.com');
    console.log('Password: admin123456');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
};

createAdminUser();