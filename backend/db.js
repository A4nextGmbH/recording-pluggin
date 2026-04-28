import mongoose from 'mongoose';

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

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  done: { type: Boolean, default: false }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, default: 'Unknown' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const bugReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  notes: { type: String, default: '' },
  appName: { type: String, required: true },
  pageUrl: { type: String, default: '' },
  videoPath: { type: String, required: true },
  reportedAt: { type: Date, default: Date.now },
  // Ticket board fields
  status: { type: String, enum: ['open', 'in_progress', 'fixed', 'wont_fix'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  assignee: { type: String, default: '' },
  tested: { type: Boolean, default: false },
  checklist: { type: [checklistItemSchema], default: [] },
  comments: { type: [commentSchema], default: [] }
});

export const BugReport = mongoose.model('BugReport', bugReportSchema);
