const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Validation rules
const submitValidation = [
  body('assignmentId').not().isEmpty().withMessage('Assignment ID is required'),
  body('answer').not().isEmpty().withMessage('Answer is required')
];

const reviewValidation = [
  body('reviewed').optional().isBoolean(),
  body('feedback').optional().isString().trim()
];

// All routes protected
router.use(authMiddleware.protect);

// Student routes
router.post(
  '/',
  roleMiddleware.authorize('student'),
  submitValidation,
  submissionController.submitAssignment
);

router.get(
  '/my',
  roleMiddleware.authorize('student'),
  submissionController.getMySubmissions
);

// Both roles can view specific submission (with access control in controller)
router.get('/:id', submissionController.getSubmission);

// Teacher route for reviewing
router.put(
  '/:id',
  roleMiddleware.authorize('teacher'),
  reviewValidation,
  submissionController.updateSubmission
);

module.exports = router;