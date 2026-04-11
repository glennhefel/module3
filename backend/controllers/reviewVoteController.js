import mongoose from 'mongoose';
import Review from '../models/review.model.js';
import ReviewVote from '../models/reviewVote.model.js';

export const voteOnReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.user?.id || req.user?._id;
    const value = Number(req.body.value); // 1 or -1

   
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const existing = await ReviewVote.findOne({ review: reviewId, user: userId });

    if (existing) {
      if (existing.value === value) {
        await ReviewVote.deleteOne({ _id: existing._id });
      } else {
        existing.value = value;
        await existing.save();
      }
    } else {
      await ReviewVote.create({ review: reviewId, user: userId, value });
    }

  // 
  const votes = await ReviewVote.find({ review: reviewId });
  const upvotes = votes.filter(v => v.value === 1).length;
  const downvotes = votes.filter(v => v.value === -1).length;
  const score = votes.reduce((sum, v) => sum + v.value, 0);
  const total_votes = votes.length;

    await Review.findByIdAndUpdate(reviewId, { upvotes, downvotes, score, total_votes }, { new: true });

    return res.json({ upvotes, downvotes, score, total_votes });
  } catch (err) {
    console.error('voteOnReview error:', err.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
};