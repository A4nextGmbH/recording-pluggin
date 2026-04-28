import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { connectDB, BugReport } from './db.js';
import { uploadVideo } from './storage.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-set-a-strong-secret-in-env';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/plugin', express.static(path.join(__dirname, '../plugin/dist')));

// ─── Auth middleware ──────────────────────────────────────────────────────────

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ─── Auth endpoints ───────────────────────────────────────────────────────────

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, username });
  }
  res.status(401).json({ error: 'Invalid username or password' });
});

// ─── Bug report endpoints ─────────────────────────────────────────────────────

// POST is intentionally open — used by the browser plugin from external origins
app.post('/bug-reports', uploadVideo(), async (req, res) => {
  try {
    const { title, notes, appName, pageUrl, reportedAt } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Video file is required.' });
    if (!file.location) return res.status(500).json({ error: 'Configure S3 and set STORAGE_TYPE=s3.' });

    const newReport = new BugReport({
      title,
      notes,
      appName,
      pageUrl,
      videoPath: file.location,
      reportedAt: reportedAt || new Date()
    });
    await newReport.save();
    res.status(201).json({ message: 'Bug report saved', report: newReport });
  } catch (error) {
    console.error('Error saving bug report:', error);
    res.status(500).json({ error: 'Failed to process bug report' });
  }
});

// GET all reports — requires auth
app.get('/bug-reports', requireAuth, async (req, res) => {
  try {
    const { appName } = req.query;
    const filter = appName ? { appName } : {};
    const reports = await BugReport.find(filter).sort({ reportedAt: -1 });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formatted = reports.map(r => {
      const doc = r.toObject();
      doc.videoUrl = /^https?:\/\//i.test(doc.videoPath) ? doc.videoPath : `${baseUrl}${doc.videoPath}`;
      return doc;
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({ error: 'Failed to fetch bug reports' });
  }
});

// PATCH — update ticket fields (status, priority, assignee, tested, checklist, comments)
app.patch('/bug-reports/:id', requireAuth, async (req, res) => {
  try {
    const allowed = ['status', 'priority', 'assignee', 'tested', 'checklist', 'comments'];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const updated = await BugReport.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Report not found' });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const doc = updated.toObject();
    doc.videoUrl = /^https?:\/\//i.test(doc.videoPath) ? doc.videoPath : `${baseUrl}${doc.videoPath}`;

    res.json(doc);
  } catch (error) {
    console.error('Error updating bug report:', error);
    res.status(500).json({ error: 'Failed to update bug report' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'listening', port: Number(PORT), time: new Date().toISOString() });
});

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
