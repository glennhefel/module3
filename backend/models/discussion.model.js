import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema({
  media: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Media', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true,
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  editedAt: { 
    type: Date 
  },
  isEdited: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

// Index for efficient queries
discussionSchema.index({ media: 1, createdAt: -1 });
discussionSchema.index({ user: 1 });

export default mongoose.model('Discussion', discussionSchema);
