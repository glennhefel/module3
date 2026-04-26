import mongoose from 'mongoose';

const directMessageItemSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const directMessageSchema = new mongoose.Schema({
  participants: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    validate: {
      validator: (value) => Array.isArray(value) && value.length === 2,
      message: 'Conversation must have exactly two participants.',
    },
    required: true,
  },
  participantsKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  messages: {
    type: [directMessageItemSchema],
    default: [],
  },
}, {
  timestamps: true,
});

directMessageSchema.index({ participantsKey: 1 }, { unique: true });
directMessageSchema.index({ updatedAt: -1 });

const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);
export default DirectMessage;

