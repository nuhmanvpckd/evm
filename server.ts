import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

let __filename = '';
let __dirname = '';

// Check if we're in an ESM environment
if (typeof import.meta !== 'undefined' && (import.meta as any).url) {
  __filename = fileURLToPath((import.meta as any).url);
  __dirname = path.dirname(__filename);
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI?.trim();
const JWT_SECRET = process.env.JWT_SECRET?.trim();

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  if (!MONGODB_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not set in environment variables.');
    throw new Error('MONGODB_URI is missing');
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('Successfully connected to MongoDB');
    await createDefaultAdmin();
  } catch (err) {
    console.error('MongoDB connection error:', err instanceof Error ? err.message : err);
    throw err;
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    try {
      await connectDB();
      next();
    } catch (err) {
      return res.status(500).json({ 
        message: 'Database connection failed', 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
  } else {
    next();
  }
});

// Models
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  photo: { type: String },
  position: { type: Number, required: true, min: 1, max: 10 },
  votes: { type: Number, default: 0 }
});

const DemoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  vvpat_enabled: { type: Boolean, default: true },
  candidates: [CandidateSchema],
  created_at: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', AdminSchema);
const Demo = mongoose.model('Demo', DemoSchema);

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  if (!JWT_SECRET) {
    console.error('CRITICAL ERROR: JWT_SECRET is not set in environment variables.');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = (decoded as any).id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Create initial admin if none exists
const createDefaultAdmin = async () => {
  try {
    const count = await Admin.countDocuments();
    console.log(`Current admin count: ${count}`);
    if (count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      try {
        await Admin.create({ email: 'admin@evm.com', password: hashedPassword });
        console.log('Default admin created: admin@evm.com / admin123');
      } catch (err: any) {
        if (err.code === 11000) {
          console.log('Admin already created by another process.');
        } else {
          throw err;
        }
      }
    } else {
      console.log('Admin user(s) already exist.');
    }
  } catch (err) {
    console.error('Failed to create default admin:', err);
  }
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!JWT_SECRET) {
    console.error('CRITICAL ERROR: JWT_SECRET is not set in environment variables.');
    return res.status(500).json({ message: 'JWT_SECRET is missing' });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { email: admin.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

app.get('/api/auth/me', authenticate, async (req: any, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Demo Routes
app.get('/api/demos', authenticate, async (req, res) => {
  try {
    const demos = await Demo.find().sort({ created_at: -1 });
    res.json(demos);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/demo/create', authenticate, async (req, res) => {
  const { name, slug, vvpat_enabled } = req.body;
  try {
    const demo = new Demo({ name, slug, vvpat_enabled, candidates: [] });
    await demo.save();
    res.json(demo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/demo/:slug', async (req, res) => {
  try {
    const demo = await Demo.findOne({ slug: req.params.slug });
    if (!demo) return res.status(404).json({ message: 'Demo not found' });
    res.json(demo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/demo/id/:id', authenticate, async (req, res) => {
  try {
    const demo = await Demo.findById(req.params.id);
    if (!demo) return res.status(404).json({ message: 'Demo not found' });
    res.json(demo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/demo/:id', authenticate, async (req, res) => {
  try {
    await Demo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Demo deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/candidate/add', authenticate, async (req, res) => {
  const { demoId, name, symbol, photo, position } = req.body;
  try {
    const demo = await Demo.findById(demoId);
    if (!demo) return res.status(404).json({ message: 'Demo not found' });
    
    // Validate position (1-10)
    if (position < 1 || position > 10) {
      return res.status(400).json({ message: 'Position must be between 1 and 10' });
    }

    // Check for duplicate position
    const isDuplicate = demo.candidates.some(c => c.position === position);
    if (isDuplicate) {
      return res.status(400).json({ message: 'Position already occupied' });
    }

    demo.candidates.push({ name, symbol, photo, position, votes: 0 } as any);
    await demo.save();
    res.json(demo);
  } catch (err) {
    console.error('Add candidate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/candidate/edit', authenticate, async (req, res) => {
  const { demoId, candidateId, name, symbol, photo, position } = req.body;
  try {
    const demo = await Demo.findById(demoId);
    if (!demo) return res.status(404).json({ message: 'Demo not found' });
    
    const candidate = (demo.candidates as any).id(candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    
    // Validate position (1-10)
    if (position < 1 || position > 10) {
      return res.status(400).json({ message: 'Position must be between 1 and 10' });
    }

    // Check for duplicate position (excluding the current candidate)
    const isDuplicate = demo.candidates.some(c => c.position === position && c._id.toString() !== candidateId);
    if (isDuplicate) {
      return res.status(400).json({ message: 'Position already occupied' });
    }

    candidate.name = name;
    candidate.symbol = symbol;
    candidate.photo = photo;
    candidate.position = position;
    
    await demo.save();
    res.json(demo);
  } catch (err) {
    console.error('Edit candidate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/candidate/delete', authenticate, async (req, res) => {
  const { demoId, candidateId } = req.body;
  try {
    const demo = await Demo.findById(demoId);
    if (!demo) return res.status(404).json({ message: 'Demo not found' });
    
    (demo.candidates as any).pull(candidateId);
    await demo.save();
    res.json(demo);
  } catch (err) {
    console.error('Delete candidate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/vote', async (req, res) => {
  const { demoId, candidateId } = req.body;
  try {
    const demo = await Demo.findById(demoId);
    if (!demo) return res.status(404).json({ message: 'Demo not found' });
    
    const candidate = (demo.candidates as any).id(candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    
    candidate.votes += 1;
    await demo.save();
    res.json({ message: 'Vote recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/demo/reset', authenticate, async (req, res) => {
  const { demoId } = req.body;
  try {
    const demo = await Demo.findById(demoId);
    if (!demo) return res.status(404).json({ message: 'Demo not found' });
    demo.candidates.forEach(c => c.votes = 0);
    await demo.save();
    res.json(demo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  (async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  })();
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

import serverless from 'serverless-http';
//nuh
export const handler = serverless(app);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
