import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  media: { type: mongoose.Schema.Types.ObjectId, ref: "Media", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true },
  comment: {
    type: String,
    default: "(This guy wrote nothing)",
  },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
}, {
  timestamps: true
});

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;