import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Watchlist from '../models/watchlist.model.js';
import Review from '../models/review.model.js';
import Discussion from '../models/discussion.model.js';
import Media from '../models/media.model.js';
import DirectMessage from '../models/directMessage.model.js';
import { authenticateToken } from '../middleware/authi.js';

const router = Router();

function addGenreScore(vector, genre, weight) {
  if (!genre || typeof genre !== 'string') return;
  const normalized = genre.trim();
  if (!normalized) return;
  vector[normalized] = (vector[normalized] || 0) + weight;
}

function buildTasteVector({ favoriteGenres = [], watchlistItems = [], reviews = [] }) {
  const vector = {};

  favoriteGenres.forEach((genre) => addGenreScore(vector, genre, 4));
  watchlistItems.forEach((item) => addGenreScore(vector, item?.media?.genre, 1));
  reviews.forEach((review) => {
    const ratingWeight = Math.max(0, Math.min(10, Number(review?.rating) || 0)) / 10;
    addGenreScore(vector, review?.media?.genre, 2 + ratingWeight);
  });

  return vector;
}

function cosineSimilarity(vectorA, vectorB) {
  const keys = new Set([...Object.keys(vectorA), ...Object.keys(vectorB)]);
  if (keys.size === 0) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  keys.forEach((key) => {
    const a = vectorA[key] || 0;
    const b = vectorB[key] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function getSortedParticipantIds(idA, idB) {
  return [String(idA), String(idB)].sort().map((id) => new mongoose.Types.ObjectId(id));
}

function getParticipantsKey(idA, idB) {
  return [String(idA), String(idB)].sort().join(':');
}

const MAX_EQUIPPED_BADGES = 3;
const ACHIEVEMENT_BADGES = [
  {
    id: 'movie-marathon-i',
    title: 'Movie Marathon I',
    description: 'Complete 5 movies in your watchlist.',
    metric: 'completedMovies',
    target: 5,
    image: '/badge1.png',
  },
  {
    id: 'movie-marathon-ii',
    title: 'Movie Marathon II',
    description: 'Complete 20 movies in your watchlist.',
    metric: 'completedMovies',
    target: 20,
    image: '/badge1.png',
  },
  {
    id: 'discussion-spark',
    title: 'Discussion Spark',
    description: 'Post 15 discussion comments.',
    metric: 'discussionComments',
    target: 15,
    image: '/badge1.png',
  },
  {
    id: 'upvote-magnet',
    title: 'Upvote Magnet',
    description: 'Earn 30 upvotes on your reviews.',
    metric: 'reviewUpvotes',
    target: 30,
    image: '/badge1.png',
  },
];

async function getUserAchievementStats(userId) {
  const [watchlist, discussionCount, reviewAgg] = await Promise.all([
    Watchlist.findOne({ user: userId }).populate('items.media', 'media'),
    Discussion.countDocuments({ user: userId }),
    Review.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(String(userId)) } },
      {
        $group: {
          _id: null,
          totalUpvotes: { $sum: '$upvotes' },
        },
      },
    ]),
  ]);

  const completedMovies = (watchlist?.items || []).filter(
    (item) => item?.status === 'completed' && item?.media?.media === 'Movies'
  ).length;

  return {
    completedMovies,
    discussionComments: discussionCount || 0,
    reviewUpvotes: reviewAgg?.[0]?.totalUpvotes || 0,
  };
}

function buildAchievementPayload(stats) {
  return ACHIEVEMENT_BADGES.map((badge) => {
    const current = stats[badge.metric] || 0;
    return {
      ...badge,
      current,
      earned: current >= badge.target,
      progress: Math.min(current, badge.target),
    };
  });
}

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

    const { username, email, password, avatar, favoriteQuote, favoriteGenres } = req.body;
    const update = {};
    if (username) update.username = username;
    if (email) update.email = email;
    if (password) update.password = await bcrypt.hash(password, 10);
    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return res.status(400).json({ error: 'avatar must be a string' });
      }
      const normalizedAvatar = avatar.trim();
      if (normalizedAvatar.length > 3000000) {
        return res.status(400).json({ error: 'avatar image is too large' });
      }
      update.avatar = normalizedAvatar;
    }
    if (favoriteQuote !== undefined) {
      if (typeof favoriteQuote !== 'string') {
        return res.status(400).json({ error: 'favoriteQuote must be a string' });
      }
      update.favoriteQuote = favoriteQuote.trim();
    }
    if (favoriteGenres !== undefined) {
      if (!Array.isArray(favoriteGenres)) {
        return res.status(400).json({ error: 'favoriteGenres must be an array of strings' });
      }
      const availableGenres = await Media.distinct('genre');
      const availableGenreSet = new Set(
        availableGenres
          .filter((genre) => typeof genre === 'string' && genre.trim())
          .map((genre) => genre.trim())
      );

      update.favoriteGenres = [
        ...new Set(
          favoriteGenres
            .filter((genre) => typeof genre === 'string' && genre.trim())
            .map((genre) => genre.trim())
        ),
      ].filter((genre) => availableGenreSet.has(genre));
    }

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

router.get('/me/achievements', authenticateToken, async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(uid).select('equippedBadges');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const stats = await getUserAchievementStats(uid);
    const achievements = buildAchievementPayload(stats);
    const earnedBadgeSet = new Set(
      achievements.filter((achievement) => achievement.earned).map((achievement) => achievement.id)
    );
    const equippedBadges = (user.equippedBadges || []).filter((badgeId) => earnedBadgeSet.has(badgeId));

    return res.json({
      achievements,
      equippedBadges,
      maxEquippedBadges: MAX_EQUIPPED_BADGES,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.patch('/me/achievements/equipped', authenticateToken, async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { badgeIds } = req.body;
    if (!Array.isArray(badgeIds)) {
      return res.status(400).json({ error: 'badgeIds must be an array' });
    }

    const uniqueBadgeIds = [...new Set(badgeIds.filter((id) => typeof id === 'string').map((id) => id.trim()))]
      .filter(Boolean);

    if (uniqueBadgeIds.length > MAX_EQUIPPED_BADGES) {
      return res.status(400).json({ error: `You can equip at most ${MAX_EQUIPPED_BADGES} badges` });
    }

    const stats = await getUserAchievementStats(uid);
    const achievements = buildAchievementPayload(stats);
    const earnedBadgeSet = new Set(
      achievements.filter((achievement) => achievement.earned).map((achievement) => achievement.id)
    );

    const invalidBadges = uniqueBadgeIds.filter((badgeId) => !earnedBadgeSet.has(badgeId));
    if (invalidBadges.length > 0) {
      return res.status(400).json({ error: 'You can only equip earned badges' });
    }

    const updated = await User.findByIdAndUpdate(
      uid,
      { equippedBadges: uniqueBadgeIds },
      { new: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'Equipped badges updated', user: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message || String(err) });
  }
});

router.get('/me/taste-matches', authenticateToken, async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const selfUser = await User.findById(uid).select('favoriteGenres');
    if (!selfUser) return res.status(404).json({ error: 'User not found' });

    const [selfWatchlist, selfReviews] = await Promise.all([
      Watchlist.findOne({ user: uid }).populate('items.media', 'genre'),
      Review.find({ user: uid }).populate('media', 'genre').select('media rating'),
    ]);

    const selfVector = buildTasteVector({
      favoriteGenres: selfUser.favoriteGenres || [],
      watchlistItems: selfWatchlist?.items || [],
      reviews: selfReviews || [],
    });

    const candidates = await User.find({ _id: { $ne: uid } }).select('username avatar favoriteGenres favoriteQuote');
    if (candidates.length === 0) return res.json({ matches: [] });

    const candidateIds = candidates.map((candidate) => candidate._id);
    const [candidateWatchlists, candidateReviews] = await Promise.all([
      Watchlist.find({ user: { $in: candidateIds } }).populate('items.media', 'genre'),
      Review.find({ user: { $in: candidateIds } }).populate('media', 'genre').select('user media rating'),
    ]);

    const watchlistMap = new Map(
      candidateWatchlists.map((watchlist) => [String(watchlist.user), watchlist.items || []])
    );

    const reviewsMap = new Map();
    candidateReviews.forEach((review) => {
      const ownerId = String(review.user);
      const list = reviewsMap.get(ownerId) || [];
      list.push(review);
      reviewsMap.set(ownerId, list);
    });

    const matches = candidates
      .map((candidate) => {
        const candidateId = String(candidate._id);
        const vector = buildTasteVector({
          favoriteGenres: candidate.favoriteGenres || [],
          watchlistItems: watchlistMap.get(candidateId) || [],
          reviews: reviewsMap.get(candidateId) || [],
        });
        const similarity = cosineSimilarity(selfVector, vector);
        const commonGenres = Object.keys(selfVector)
          .filter((genre) => (vector[genre] || 0) > 0)
          .sort((a, b) => Math.min(vector[b], selfVector[b]) - Math.min(vector[a], selfVector[a]))
          .slice(0, 5);

        return {
          user: {
            _id: candidate._id,
            username: candidate.username,
            avatar: candidate.avatar || '',
            favoriteQuote: candidate.favoriteQuote || '',
            favoriteGenres: candidate.favoriteGenres || [],
          },
          matchScore: Math.round(similarity * 100),
          commonGenres,
        };
      })
      .filter((item) => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 25);

    return res.json({ matches });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.get('/me/dms', authenticateToken, async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const conversations = await DirectMessage.find({ participants: uid })
      .populate('participants', 'username avatar favoriteQuote')
      .sort({ updatedAt: -1 });

    const result = conversations.map((conversation) => {
      const otherUser = conversation.participants.find((participant) => String(participant._id) !== String(uid));
      const lastMessage = conversation.messages[conversation.messages.length - 1] || null;
      return {
        _id: conversation._id,
        otherUser: otherUser || null,
        lastMessage,
        updatedAt: conversation.updatedAt,
      };
    });

    return res.json({ conversations: result });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.get('/me/dms/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { otherUserId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (String(uid) === String(otherUserId)) {
      return res.status(400).json({ error: 'Cannot open a direct message with yourself' });
    }

    const otherUser = await User.findById(otherUserId).select('username avatar favoriteQuote');
    if (!otherUser) return res.status(404).json({ error: 'User not found' });

    const participantsKey = getParticipantsKey(uid, otherUserId);
    const conversation = await DirectMessage.findOne({ participantsKey })
      .populate('messages.sender', 'username avatar');

    return res.json({
      conversation: conversation
        ? {
            _id: conversation._id,
            messages: conversation.messages || [],
          }
        : {
            _id: null,
            messages: [],
          },
      otherUser,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.post('/me/dms/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { otherUserId } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (String(uid) === String(otherUserId)) {
      return res.status(400).json({ error: 'Cannot send a direct message to yourself' });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    if (message.trim().length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 characters)' });
    }

    const otherUser = await User.findById(otherUserId).select('username avatar favoriteQuote');
    if (!otherUser) return res.status(404).json({ error: 'User not found' });

    const participantsKey = getParticipantsKey(uid, otherUserId);
    const participantIds = getSortedParticipantIds(uid, otherUserId);
    let conversation = await DirectMessage.findOne({ participantsKey });
    if (!conversation) {
      conversation = new DirectMessage({
        participants: participantIds,
        participantsKey,
        messages: [],
      });
    }

    conversation.messages.push({
      sender: uid,
      text: message.trim(),
    });

    await conversation.save();
    await conversation.populate('messages.sender', 'username avatar');

    return res.status(201).json({
      conversation: {
        _id: conversation._id,
        messages: conversation.messages,
      },
      otherUser,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /users/:id/watchlist - Get public watchlist of a user
router.get('/:id/watchlist', async (req, res) => {
  try {
    const { id } = req.params;
    const wl = await Watchlist.findOne({ user: id }).populate('items.media', 'title poster genre media release_date');
    if (!wl) return res.json([]);

    const mediaIds = wl.items.map(i => i.media?._id).filter(Boolean);
    const userRatings = await Review.find({ user: id, media: { $in: mediaIds } }).select('media rating');

    const ratingMap = {};
    userRatings.forEach((rating) => {
      ratingMap[rating.media.toString()] = rating.rating;
    });

    return res.json(
      wl.items.map((i) => ({
        media: i.media,
        addedAt: i.addedAt,
        status: i.status || 'plan_to_watch',
        userRating: i.media?._id ? ratingMap[i.media._id.toString()] || null : null,
      }))
    );
  } catch (err) {
    return res.status(400).json({ error: err.message || String(err) });
  }
});

// GET /users/:id/reviews - Get reviews of a user
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await Review.find({ user: id })
      .populate('media', 'title poster genre release_date')
      .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (err) {
    return res.status(400).json({ error: err.message || String(err) });
  }
});

// GET /users/:id/discussions - Get discussions of a user
router.get('/:id/discussions', async (req, res) => {
  try {
    const { id } = req.params;
    const discussions = await Discussion.find({ user: id })
      .populate('media', 'title poster genre release_date')
      .sort({ createdAt: -1 });

    return res.json(discussions);
  } catch (err) {
    return res.status(400).json({ error: err.message || String(err) });
  }
});

// GET /users/:id - Get a public user profile by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ error: err.message || String(err) });
  }
});

export default router;
