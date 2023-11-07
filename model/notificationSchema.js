const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  message: { type: String, required: false },
  image: { type: Object, required: false },
  linkId: { type: String, required: false },
  role: { type: String, enum: ['admin', 'c_creator', 'unknown'], default: 'unknown' },
  type: { type: String, enum: ['user', 'payment', 'unknown'], default: 'unknown' },
  viewStatus: { type: Boolean, enum: [true, false], default: false }
},
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification
