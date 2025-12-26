const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { validationResult } = require('express-validator');

// @desc    Create new assignment
// @route   POST /api/assignments
exports.createAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate } = req.body;

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all assignments for teacher
// @route   GET /api/assignments/teacher
exports.getTeacherAssignments = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = { createdBy: req.user.id };
    
    if (status && ['draft', 'published', 'completed'].includes(status)) {
      query.status = status;
    }
    
    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    
    // Get submission counts for each assignment
    const assignmentsWithCounts = await Promise.all(
      assignments.map(async (assignment) => {
        const submissionCount = await Submission.countDocuments({
          assignment: assignment._id
        });
        return {
          ...assignment.toObject(),
          submissionCount
        };
      })
    );
    
    res.json({
      success: true,
      count: assignmentsWithCounts.length,
      data: assignmentsWithCounts
    });
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get published assignments for students
// @route   GET /api/assignments/student
exports.getStudentAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ 
      status: 'published'
    })
      .sort({ dueDate: 1 })
      .select('title description dueDate createdAt status');
    
    // Check which assignments the student has already submitted
    const assignmentsWithSubmission = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: req.user.id
        });
        
        return {
          ...assignment.toObject(),
          hasSubmitted: !!submission,
          submissionId: submission?._id,
          canSubmit: new Date(assignment.dueDate) > new Date()
        };
      })
    );
    
    res.json({
      success: true,
      count: assignmentsWithSubmission.length,
      data: assignmentsWithSubmission
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if user has access
    if (req.user.role === 'student' && assignment.status !== 'published') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // For teachers, check if they created the assignment
    if (req.user.role === 'teacher' && assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
exports.updateAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    let assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check ownership
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Cannot update if status is completed
    if (assignment.status === 'completed') {
      return res.status(400).json({ message: 'Completed assignments cannot be modified' });
    }
    
    const { title, description, dueDate, status } = req.body;
    
    console.log('Updating assignment:', { id: req.params.id, currentStatus: assignment.status, newStatus: status });
    
    // Update basic fields
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    
    // Handle status transitions
    if (status && status !== assignment.status) {
      console.log('Attempting status change:', assignment.status, '->', status);
      
      // Validate status transition
      if (assignment.status === 'draft' && status === 'published') {
        assignment.status = 'published';
        assignment.publishedAt = new Date();
        console.log('Status changed to published');
      } 
      else if (assignment.status === 'published' && status === 'completed') {
        assignment.status = 'completed';
        assignment.completedAt = new Date();
        console.log('Status changed to completed');
      }
      else {
        return res.status(400).json({ 
          message: `Invalid status transition from ${assignment.status} to ${status}` 
        });
      }
    }
    
    await assignment.save();
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check ownership
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Cannot delete if not in draft status
    if (assignment.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Only draft assignments can be deleted' 
      });
    }
    
    // Delete related submissions
    await Submission.deleteMany({ assignment: assignment._id });
    
    await assignment.deleteOne();
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get assignment submissions
// @route   GET /api/assignments/:id/submissions
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check ownership
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const submissions = await Submission.find({ assignment: assignment._id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });
    
    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update assignment status only
// @route   PUT /api/assignments/:id/status
exports.updateAssignmentStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    let assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check ownership
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { status } = req.body;
    
    console.log('Updating assignment status:', { 
      id: req.params.id, 
      currentStatus: assignment.status, 
      newStatus: status 
    });
    
    // Validate status transition
    if (assignment.status === 'draft' && status === 'published') {
      assignment.status = 'published';
      assignment.publishedAt = new Date();
      console.log('✅ Status changed to published');
    } 
    else if (assignment.status === 'published' && status === 'completed') {
      assignment.status = 'completed';
      assignment.completedAt = new Date();
      console.log('✅ Status changed to completed');
    }
    else {
      return res.status(400).json({ 
        message: `Invalid status transition from ${assignment.status} to ${status}` 
      });
    }
    
    await assignment.save();
    
    res.json({
      success: true,
      message: `Assignment ${status} successfully!`,
      data: assignment
    });
  } catch (error) {
    console.error('Update assignment status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
    });
  }
};