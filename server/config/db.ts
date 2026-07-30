import mongoose from "mongoose";

const connectDB = async () => {
   try {
       mongoose.connection.on("connected", () => console.log("MongoDB connected successfully"));
       mongoose.connection.on("error", (err) => console.error("MongoDB connection error:", err));

       await mongoose.connect(process.env.MONGODB_URI!, {
           serverSelectionTimeoutMS: 5000, // Fail after 5 seconds instead of 30
           family: 4 // Force IPv4 to bypass modern Node.js IPv6 resolution bugs
       });
   } catch (error) {
       console.error("Failed to connect to MongoDB:", error);
       process.exit(1);
   }
}

export default connectDB;