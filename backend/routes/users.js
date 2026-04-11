import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Watchlist from '../models/watchlist.model.js';
import Review from '../models/review.model.js';
import Discussion from '../models/discussion.model.js';
import { authenticateToken } from '../middleware/authi.js';

const router = Router();

router.get('/', (req, res) => {
  User.find()
    .then(users => res.json(users))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.post('/add', (req, res) => {
  const { username, password, email, isAdmin = false } = req.body;
  const newUser = new User({ username, password, email, isAdmin });

  newUser.save()
    .then(() => res.status(201).json({ message: 'User added!', user: newUser }))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });
    
    const token = jwt.sign(
      { id: user._id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.status(200).json({ message: "Login successful", user, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = username === "admin";
    const newUser = new User({ username, password: hashedPassword, email, isAdmin});
    await newUser.save();
    res.status(201).json({ message: 'User added!', user: newUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /users/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(uid).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { username, email, password } = req.body;
    const update = {};
    if (username) update.username = username;
    if (email) update.email = email;
    if (password) update.password = await bcrypt.hash(password, 10);

    const updated = await User.findByIdAndUpdate(uid, update, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ error: 'User not found' });

    return res.json({ message: 'User updated', user: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message || String(err) });
  }
});

router.get('/me/watchlist', authenticateToken, async (req, res) => {
  try {
    const wl = await Watchlist.findOne({ user: req.user.id }).populate('items.media', 'title poster genre media');
    if (!wl) return res.json([]);
    
    // Get user's ratings 
    const mediaIds = wl.items.map(i => i.media._id);
    const userRatings = await Review.find({ 
      user: req.user.id, 
      media: { $in: mediaIds } 
    }).select('media rating');
    
    // Create a map of mediaId -> rating for quick lookup
    const ratingMap = {};
    userRatings.forEach(rating => {
      ratingMap[rating.media.toString()] = rating.rating;
    });
    
    return res.json(wl.items.map(i => ({ 
      media: i.media, 
      addedAt: i.addedAt, 
      status: i.status || 'plan_to_watch',
      userRating: ratingMap[i.media._id.toString()] || null
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// POST /users/me/watchlist - Add mediaId to current user's watchlist
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

// DELETE /users/me/watchlist/:mediaId - Remove mediaId from current user's watchlist
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

// PUT /users/me/watchlist/:mediaId/status - Update status of a watchlist item
router.put('/me/watchlist/:mediaId/status', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { status } = req.body;
    
    if (!['watching', 'completed', 'dropped', 'plan_to_watch'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const wl = await Watchlist.findOne({ user: req.user.id });
    if (!wl) return res.status(404).json({ error: 'Watchlist not found' });
    
    const item = wl.items.find(item => String(item.media) === String(mediaId));
    if (!item) return res.status(404).json({ error: 'Item not found in watchlist' });
    
    item.status = status;
    await wl.save();
    
    return res.json({ message: 'Status updated', mediaId, status });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /users/me/reviews - Get current user's reviews
router.get('/me/reviews', authenticateToken, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('media', 'title poster genre release_date')
      .sort({ createdAt: -1 });
    
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /users/me/discussions - Get current user's discussions
router.get('/me/discussions', authenticateToken, async (req, res) => {
  try {
    const discussions = await Discussion.find({ user: req.user.id })
      .populate('media', 'title poster genre release_date')
      .sort({ createdAt: -1 });
    
    return res.json(discussions);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;