import express from 'express';
import cors from 'cors';
import supabase from '../utils/supabase.js';

const router = express.Router();

// Configure CORS
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Get ScrollView state endpoint
router.get('/get', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scroll_view_state')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    res.json({
      showFlag: data.show_flag,
      timestamp: data.timestamp
    });
  } catch (error) {
    console.error('Error getting scroll view state:', error);
    res.status(500).json({ error: 'Failed to get scroll view state' });
  }
});

// Update ScrollView endpoint
router.post('/update', async (req, res) => {
  const { showFlag } = req.body;
  
  if (showFlag === undefined) {
    return res.status(400).json({ error: 'showFlag parameter is required' });
  }
  
  if (typeof showFlag !== 'boolean') {
    return res.status(400).json({ error: 'showFlag must be a boolean' });
  }

  try {
    // Update the state in database
    const { data, error } = await supabase
      .from('scroll_view_state')
      .insert([{
        show_flag: showFlag,
        timestamp: new Date().toISOString()
      }]);

    if (error) throw error;

    res.json({ success: true, showFlag });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update state' });
  }
});

export default router;