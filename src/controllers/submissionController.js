const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { validationResult } = require('express-validator');

// @desc    Submit assignment
// @route   POST /api/submissions
exports.submitAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignmentId, answer } = req.body;

    // Check if assignment exists and is published
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    if (assignment.status !== 'published') {
      return res.status(400).json({ message: 'Assignment is not published' });
    }
    
    // Check due date
    if (new Date(assignment.dueDate) < new Date()) {
      return res.status(400).json({ message: 'Submission deadline has passed' });
    }
    
    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user.id
    });
    
    if (existingSubmission) {
      return res.status(400).json({ message: 'Already submitted to this assignment' });
    }
    
    // Create submission
    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user.id,
      answer
    });
    
    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    
    // Handle duplicate submission error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already submitted to this assignment' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get my submissions
// @route   GET /api/submissions/my
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate('assignment', 'title description dueDate status')
      .sort({ submittedAt: -1 });
    
    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single submission - ADD THIS MISSING FUNCTION
// @route   GET /api/submissions/:id
exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignment', 'title description dueDate status createdBy')
      .populate('student', 'name email');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Check access
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // For teachers, check if they created the assignment
    if (req.user.role === 'teacher') {
      const assignment = await Assignment.findById(submission.assignment._id);
      if (!assignment || assignment.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update submission (review)
// @route   PUT /api/submissions/:id
exports.updateSubmission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { reviewed, feedback } = req.body;
    
    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Check if teacher created the assignment
    const assignment = await Assignment.findById(submission.assignment);
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update fields
    if (reviewed !== undefined) {
      submission.reviewed = reviewed;
      submission.reviewedAt = reviewed ? new Date() : null;
    }
    
    if (feedback !== undefined) {
      submission.feedback = feedback;
    }
    
    await submission.save();
    
    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};