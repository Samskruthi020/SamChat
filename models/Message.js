const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 }
    ]
  })
  .populate('sender', 'username avatar')
  .populate('receiver', 'username avatar')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to mark all messages as read
messageSchema.statics.markConversationAsRead = function(senderId, receiverId) {
  return this.updateMany(
    { sender: senderId, receiver: receiverId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

module.exports = mongoose.model('Message', messageSchema); 