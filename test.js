require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB)
  .then(() => {
    console.log("✅ Connected to MongoDB!");
    process.exit(0);
  })
  .catch((err) => {
    console.log("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
