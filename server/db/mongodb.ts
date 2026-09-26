import mongoose from "mongoose";

// College Schema
const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  adminEmail: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["STUDENT", "DRIVER", "ADMIN"], required: true },
  collegeId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Route Schema
const routeSchema = new mongoose.Schema({
  collegeId: { type: String, required: true },
  name: { type: String, required: true },
  stops: [
    {
      id: String,
      name: String,
      coordinates: { latitude: Number, longitude: Number },
      order: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Bus Schema
const busSchema = new mongoose.Schema({
  collegeId: { type: String, required: true },
  busNumber: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: {
    type: String,
    enum: ["ACTIVE", "IDLE", "MAINTENANCE", "OFFLINE"],
    default: "IDLE",
  },
  currentRouteName: String,
  assignedDriverId: String,
  createdAt: { type: Date, default: Date.now },
});

// Trip Schema
const tripSchema = new mongoose.Schema({
  collegeId: { type: String, required: true },
  busId: { type: String, required: true },
  driverId: { type: String, required: true },
  status: {
    type: String,
    enum: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
    default: "IN_PROGRESS",
  },
  startTime: { type: Date, required: true },
  endTime: Date,
  occupancy: { type: Number, default: 0 },
  route: String,
  createdAt: { type: Date, default: Date.now },
});

// Location Schema (GPS history)
const locationSchema = new mongoose.Schema({
  collegeId: { type: String, required: true },
  tripId: { type: String, required: true },
  busId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number },
  recordedAt: { type: Date, default: Date.now },
});

// Emergency Alert Schema
const emergencyAlertSchema = new mongoose.Schema({
  collegeId: { type: String, required: true },
  tripId: { type: String, required: true },
  driverId: { type: String, required: true },
  status: {
    type: String,
    enum: ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"],
    default: "ACTIVE",
  },
  location: { latitude: Number, longitude: Number },
  createdAt: { type: Date, default: Date.now },
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  collegeId: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
  readBy: [String],
  createdAt: { type: Date, default: Date.now },
});

// Schedule Schema
const scheduleSchema = new mongoose.Schema({
  collegeId: { type: String, required: true },
  busId: { type: String, required: true },
  routeName: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String },
  operatingDays: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

// Complaint Schema
const complaintSchema = new mongoose.Schema({
  collegeId: { type: String, required: true },
  studentId: { type: String, required: true },
  tripId: String,
  busId: String,
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    default: "OPEN",
  },
  adminResponse: String,
  createdAt: { type: Date, default: Date.now },
});

// Create models
export const College = mongoose.model("College", collegeSchema);
export const User = mongoose.model("User", userSchema);
export const Route = mongoose.model("Route", routeSchema);
export const Bus = mongoose.model("Bus", busSchema);
export const Trip = mongoose.model("Trip", tripSchema);
export const Location = mongoose.model("Location", locationSchema);
export const EmergencyAlert = mongoose.model("EmergencyAlert", emergencyAlertSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
export const Schedule = mongoose.model("Schedule", scheduleSchema);
export const Complaint = mongoose.model("Complaint", complaintSchema);

// Create indexes for performance
export async function createIndexes() {
  try {
    // GPS locations - indexed for high-frequency writes
    await Location.collection.createIndex({ trip_id: 1, recorded_at: -1 });
    await Location.collection.createIndex({ bus_id: 1, recorded_at: -1 });
    await Location.collection.createIndex({ college_id: 1 });

    // Trips
    await Trip.collection.createIndex({ bus_id: 1, status: 1 });
    await Trip.collection.createIndex({ driver_id: 1 });
    await Trip.collection.createIndex({ college_id: 1 });

    // Users
    await User.collection.createIndex({ email: 1 });
    await User.collection.createIndex({ college_id: 1 });

    // Routes and Buses
    await Route.collection.createIndex({ college_id: 1 });
    await Bus.collection.createIndex({ college_id: 1 });

    console.log("MongoDB indexes created successfully");
  } catch (error) {
    console.log("Index creation completed or already exists");
  }
}
