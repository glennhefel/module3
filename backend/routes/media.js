import express from 'express';
import mongoose from 'mongoose';
import Media from '../models/media.model.js';
import MediaRequest from '../models/mediaRequest.model.js';
import Rating from '../models/review.model.js';
import ReviewVote from '../models/reviewVote.model.js'; // Add this import brou
import { authenticateToken } from '../middleware/authi.js';
import { optionalAuthenticateToken } from '../middleware/optionalAuth.js';
import { voteOnReview } from '../controllers/reviewVoteController.js';
import { isAdmin } from '../middleware/isAdmin.js';



const router = express.Router();


function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}



// Get all media
router.get('/', async (req, res) => {
  try {
    const rawGenre = (req.query.genre || '').trim();
    const filter = {};
    if (rawGenre) {
      // Case-insensitive exact match on genre 
      filter.genre = { $regex: `^${escapeRegExp(rawGenre)}$`, $options: 'i' };
    }

    const mediaList = await Media.find(filter);
    
    const mediaWithRatings = await Promise.all(
      mediaList.map(async (media) => {
        const ratings = await Rating.find({ media: media._id });
        const total_votes = ratings.length;
        const average_rating = total_votes === 0
          ? 0
          : ratings.reduce((sum, r) => sum + r.rating, 0) / total_votes;
        return {
          ...media.toObject(),
          average_rating,
          total_votes,
        };
      })
    );
    res.json(mediaWithRatings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// search 
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    
    if (!q) {
      return res.json([]); 
    }
    
    const results = await Media.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { genre: { $regex: q, $options: 'i' } },
        { director: { $regex: q, $options: 'i' } }
      ]
    }).limit(100);
    
    res.json(results);
  } catch (err) {
    
    res.status(500).json({ error: 'Server error' });
  }
});



// Request add media
router.post('/request', authenticateToken, async (req, res) => {
  try {
    console.log('Creating media request:', req.body); 
    console.log('User ID:', req.user.id); 
    
    const mediaRequest = new MediaRequest({
      ...req.body,
      requestedBy: req.user.id
    });
    
    const savedRequest = await mediaRequest.save();
    console.log('Saved request:', savedRequest); 
    
    res.json({ message: 'Media request submitted!', request: savedRequest });
  } catch (err) {
    console.error('Error creating request:', err); 
    res.status(400).json({ error: err.message });
  }
});


router.get('/debug/requests', async (req, res) => {
  try {
    const allRequests = await MediaRequest.find();
    res.json({
      count: allRequests.length,
      requests: allRequests
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/requests', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('Admin fetching requests...'); 
    console.log('User making request:', req.user); 
    
    const requests = await MediaRequest.find()
      .populate('requestedBy', 'username')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 });
    
    console.log('Found requests:', requests.length); 
    console.log('Requests data:', requests); 
    
    res.json(requests);
  } catch (err) {
    console.error('Error fetching requests:', err); 
    res.status(500).json({ error: err.message });
  }
});


router.post('/requests/:requestId/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const request = await MediaRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

  
    const newMedia = new Media({
      title: request.title,
      release_date: request.release_date,
      media: request.media,
      genre: request.genre,
      director: request.director,
      description: request.description,
      poster: request.poster
    });

    await newMedia.save();

   
    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user.id;
    request.adminNotes = req.body.adminNotes || '';
    await request.save();

    res.json({ message: 'Request approved and media added!', media: newMedia });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/requests/:requestId/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const request = await MediaRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user.id;
    request.adminNotes = req.body.adminNotes || '';
    await request.save();

    res.json({ message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get a single media by ID 
router.get('/:id', optionalAuthenticateToken, async (req, res) => {

  
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Not found' });

    const reviews = await Rating.find({ media: media._id }).populate('user');
    const total_votes = reviews.length;
    const average_rating = total_votes === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / total_votes;

    // Did they upvote or downvote (1 or -1)
    let reviewsWithUserVotes = reviews;
    if (req.user) {
      const userVotes = await ReviewVote.find({
        user: req.user.id,
        review: { $in: reviews.map(r => r._id) }
      });

      reviewsWithUserVotes = reviews.map(review => {
        const userVote = userVotes.find(v => v.review.toString() === review._id.toString());
        return {
          ...review.toObject(),
          userVote: userVote ? userVote.value : 0
        };
      });
    }

    res.json({
      ...media.toObject(),
      reviews: reviewsWithUserVotes,
      average_rating,
      total_votes,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.post('/add', authenticateToken, isAdmin, async (req, res) => {
  try {
    const newMedia = new Media(req.body);
    await newMedia.save();
    res.json({ message: 'Media added!', media: newMedia });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update media 
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, director, genre, description, poster } = req.body;
    
    const updatedMedia = await Media.findByIdAndUpdate(
      req.params.id,
      {
        title,
        director,
        genre,
        description,
        poster
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedMedia) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    res.json(updatedMedia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  console.log('DELETE request for:', req.params.id);
  try {
    const deleted = await Media.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Media deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:mediaId/vote', authenticateToken, voteOnReview);

export default router;