const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("server is connected to db")
  } catch (error) {
    console.log("database connection failed");
  }
}

module.exports = connectDB;
