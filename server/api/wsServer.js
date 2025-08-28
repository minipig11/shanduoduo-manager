import express from 'express';
import cors from 'cors';

const router = express.Router();

// Configure CORS
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Update ScrollView endpoint
router.post('/update', (req, res) => {
  const { showFlag } = req.body;
  const wss = req.app.get('wss');
  
  if (showFlag === undefined) {
    return res.status(400).json({ error: 'showFlag parameter is required' });
  }
  
  if (typeof showFlag !== 'boolean') {
    return res.status(400).json({ error: 'showFlag must be a boolean' });
  }

  if (!wss) {
    return res.status(500).json({ error: 'WebSocket server not initialized' });
  }
  
  try {
    wss.broadcast({ type: 'updateScrollView', showFlag });
    res.json({ success: true });
  } catch (error) {
    console.error('Broadcasting error:', error);
    res.status(500).json({ error: 'Failed to broadcast message' });
  }
});

export default router;