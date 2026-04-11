import { Router } from 'express';
import Watchlist from '../models/watchlist.model.js';
import { authenticateToken } from '../middleware/authi.js';

const router = Router();

// GET /api/users/me/watchlist
router.get('/me/watchlist', authenticateToken, async (req, res) => {
  try {
    const wl = await Watchlist.findOne({ user: req.user.id }).populate('items.media', 'title poster');
    if (!wl) return res.json([]);
    return res.json(wl.items.map(i => ({ media: i.media, addedAt: i.addedAt })));
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Add mediaId to current user's watchlist
router.post('/me/watchlist', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.body;
    if (!mediaId) return res.status(400).json({ error: 'mediaId required' });

    let wl = await Watchlist.findOne({ user: req.user.id });
    if (!wl) wl = new Watchlist({ user: req.user.id, items: [] });

    if (wl.items.find(item => String(item.media) === String(mediaId))) {
      return res.status(200).json({ message: 'Already in watchlist' });
    }

    wl.items.push({ media: mediaId });
    await wl.save();
    return res.status(201).json({ message: 'Added', mediaId });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Remove mediaId from current user's watchlist
router.delete('/me/watchlist/:mediaId', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const wl = await Watchlist.findOne({ user: req.user.id });
    if (!wl) return res.status(404).json({ error: 'Watchlist not found' });

    const before = wl.items.length;
    wl.items = wl.items.filter(item => String(item.media) !== String(mediaId));
    if (wl.items.length === before) return res.status(404).json({ error: 'Item not found' });

    await wl.save();
    return res.json({ message: 'Removed', mediaId });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;