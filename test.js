import mongoose from "mongoose";

// Define the schema first
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

// Then create the model
const Rating = mongoose.model("Rating", ratingSchema);

// Sample ObjectIds (replace with real ones from your DB)
const sampleMediaId = "64cf67e3ecfa7e1cd436d123";
const sampleUserId = "64cf6894ecfa7e1cd436d456";

// Connect and insert
mongoose.connect('mongodb+srv://mythhunter19:nope@fate.rmek02r.mongodb.net/?retryWrites=true&w=majority&appName=fate');

const run = async () => {
  try {
    await Rating.create({
      media: sampleMediaId,
      user: sampleUserId,
      rating: 4,
      comment: "This was decent but could be better.",
      upvotes: 3,
      downvotes: 1
    });

    console.log("✅ Review inserted");
  } catch (err) {
    console.error("❌ Error inserting review:", err);
  } finally {
    mongoose.connection.close();
  }
};

run();