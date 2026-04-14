import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, BugReport } from './db.js';
import { uploadVideo } from './storage.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || '*';

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json()); // For handling json just in case, though we primarily use multipart
app.use(express.urlencoded({ extended: true }));

// Serve the /uploads directory statically so videos can be played back
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOADS_DIR || 'uploads')));

// Serve the plugin script
app.use('/plugin', express.static(path.join(__dirname, '../plugin/dist')));

// POST /api/bug-reports
app.post('/bug-reports', uploadVideo(), async (req, res) => {
  try {
    const { title, notes, appName, pageUrl, reportedAt } = req.body;
    
    // The uploaded file details from multer
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Video file is required.' });
    }

    const videoPath = `/uploads/${file.filename}`;

    // Create record in MongoDB
    // Note: if MongoDB is not connected, this will fail or hang unless mongoose buffers and then errors out.
    // Ensure you have MONGO_URI setup later.
    const newReport = new BugReport({
      title,
      notes,
      appName,
      pageUrl,
      videoPath,
      reportedAt: reportedAt || new Date()
    });

    await newReport.save();

    res.status(201).json({ message: 'Bug report saved', report: newReport });
  } catch (error) {
    console.error('Error saving bug report:', error);
    res.status(500).json({ error: 'Failed to process bug report' });
  }
});

// GET /api/bug-reports
app.get('/bug-reports', async (req, res) => {
  try {
    const { appName } = req.query;
    const filter = appName ? { appName } : {};

    const reports = await BugReport.find(filter).sort({ reportedAt: -1 });

    // Format full URL to video so client can just stick it into <video src="...">
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const formatted = reports.map(r => {
      const doc = r.toObject();
      doc.videoUrl = `${baseUrl}${doc.videoPath}`;
      return doc;
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({ error: 'Failed to fetch bug reports' });
  }
});

// GET / - simple health check that server is listening
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'listening',
    port: Number(PORT),
    time: new Date().toISOString()
  });
});

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
