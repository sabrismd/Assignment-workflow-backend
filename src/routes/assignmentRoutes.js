const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Validation rules for CREATE/UPDATE
const assignmentValidation = [
  body('title').optional().not().isEmpty().withMessage('Title is required'),
  body('description').optional().not().isEmpty().withMessage('Description is required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required')
];

// Validation for status change only (no required fields)
const statusValidation = [
  body('status').isIn(['published', 'completed']).withMessage('Status must be published or completed')
];

// All routes protected
router.use(authMiddleware.protect);

// Teacher routes
router.post(
  '/',
  roleMiddleware.authorize('teacher'),
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('description').not().isEmpty().withMessage('Description is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required')
  ],
  assignmentController.createAssignment
);

router.get(
  '/teacher',
  roleMiddleware.authorize('teacher'),
  assignmentController.getTeacherAssignments
);

router.get(
  '/student',
  roleMiddleware.authorize('student'),
  assignmentController.getStudentAssignments
);

// New route for updating ONLY status
router.put(
  '/:id/status',
  roleMiddleware.authorize('teacher'),
  statusValidation,
  assignmentController.updateAssignmentStatus
);

router.get(
  '/:id',
  assignmentController.getAssignment
);

router.put(
  '/:id',
  roleMiddleware.authorize('teacher'),
  assignmentValidation,
  assignmentController.updateAssignment
);

router.delete(
  '/:id',
  roleMiddleware.authorize('teacher'),
  assignmentController.deleteAssignment
);

router.get(
  '/:id/submissions',
  roleMiddleware.authorize('teacher'),
  assignmentController.getAssignmentSubmissions
);

module.exports = router;