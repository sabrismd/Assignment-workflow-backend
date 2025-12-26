const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answer: {
    type: String,
    required: [true, 'Please add your answer'],
    maxlength: [5000, 'Answer cannot be more than 5000 characters']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewedAt: {
    type: Date
  },
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot be more than 1000 characters']
  }
});

// Ensure one submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });


module.exports = mongoose.model('Submission', submissionSchema);