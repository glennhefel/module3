import mongoose from "mongoose";

const mediaTypes = ["Anime", "Movies", "TV_series"];
const genreTypes = [
  "Action", "Psychological", "Comedy", "Romance", "Sci-Fi", "Cyberpunk", "Drama", "Fantasy", "Adventure", "Mystery", "Horror", "Thriller", "Slice of Life", "Supernatural"
];

const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 250 },
  release_date: { type: Date, required: true },
  media: { type: String, enum: mediaTypes, required: true },
  genre: { type: String, enum: genreTypes, required: true },
  director: { type: String, required: true, maxlength: 250 },
  description: {
    type: String,
    default: "Theres nothing here...",
    maxlength: 10000
  },
  poster: { type: String, maxlength: 500 },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

mediaSchema.virtual("average_rating").get(function () {
  if (!this.ratings || this.ratings.length === 0) return 0.0;
  const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
  return sum / this.ratings.length;
});

mediaSchema.virtual("total_votes").get(function () {
  return this.ratings ? this.ratings.length : 0;
});

const Media = mongoose.model("Media", mediaSchema);
export default Media;