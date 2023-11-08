const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: false
  },
  gborAmount: {
    type: Number,
    required: false
  },
  donarName: {
    type: String,
    required: false
  },
  message: {
    type: String,
    required: false
  },
  isMessageVisible: {
    type: Boolean,
    default: false
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
},
  {
    timestamps: true
  }
);

const Payment = mongoose.model("payment", paymentSchema);
module.exports = Payment
