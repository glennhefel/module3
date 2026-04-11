import { Schema, model } from 'mongoose';

const mediaRequestSchema = new Schema({
  title: { type: String, required: true },
  release_date: { type: Date, required: true },
  media: { type: String, required: true }, // "Movie" or "TV Show"
  genre: { type: String, required: true },
  director: { type: String, required: true },
  description: { type: String, default: 'Theres nothing here...' },
  poster: { type: String, default: '' },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

export default model('MediaRequest', mediaRequestSchema);
