const mongoose = require("mongoose");

// Replace with your actual connection string
const uri = "mongodb+srv://bilalsonofkhirsheed:2249263bilal@cluster0.dp5gbye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function connectDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
}


module.exports = connectDB;
