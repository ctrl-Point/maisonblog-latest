const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const CommentSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true,
  },
  post: { // Reference the Post model
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
}, { timestamps: true }); // Include timestamps

const CommentModel = model('Comment', CommentSchema);

module.exports = CommentModel;
