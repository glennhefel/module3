import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const WatchlistItemSchema = new Schema({
  media: { type: Schema.Types.ObjectId, ref: 'Media', required: true },
  addedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['watching', 'completed', 'dropped', 'plan_to_watch'], 
    default: 'plan_to_watch' 
  },
}, { _id: false });

const WatchlistSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  items: { type: [WatchlistItemSchema], default: [] },
}, { timestamps: true });

export default model('Watchlist', WatchlistSchema);