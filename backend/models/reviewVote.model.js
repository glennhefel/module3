import mongoose from 'mongoose';

const reviewVoteSchema = new mongoose.Schema({
  review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, enum: [1, -1], required: true }, // 1 = upvote, -1 = downvote
}, { timestamps: true });

export default mongoose.model('ReviewVote', reviewVoteSchema);