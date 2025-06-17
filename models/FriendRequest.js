const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FriendRequestSchema = new Schema({
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
}, { timestamps: true });

// Ensure a user can only send one request to another user
FriendRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('FriendRequest', FriendRequestSchema); 