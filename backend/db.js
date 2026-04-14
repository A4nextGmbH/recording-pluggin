import mongoose from 'mongoose';

// The user specified they will provide the connection later,
// so we'll pick it up from env, but we won't crash if it's missing just yet.
export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('MONGO_URI is missing. Please provide it later to save reports.');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const bugReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  notes: { type: String, default: '' },
  appName: { type: String, required: true },
  pageUrl: { type: String, default: '' },
  videoPath: { type: String, required: true }, // The relative path, e.g. /uploads/video-123.webm
  reportedAt: { type: Date, default: Date.now }
});

export const BugReport = mongoose.model('BugReport', bugReportSchema);
