import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  email: { type: String, unique: true, required: true },
  isAdmin: { type: Boolean, default: false },
  avatar: {
    type: String,
    trim: true,
    default: '',
    maxlength: 3000000,
  },
  favoriteQuote: {
    type: String,
    trim: true,
    maxlength: 200,
    default: '',
  },
  favoriteGenres: {
    type: [String],
    default: [],
  },
  equippedBadges: {
    type: [String],
    default: [],
  },
});

const User = mongoose.model("User", userSchema);
export default User;
