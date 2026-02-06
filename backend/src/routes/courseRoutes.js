const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getCourses);
router.get('/info', courseController.getSchoolInfo);
router.get('/terms', courseController.getTerms);

// 🆕 NEW ROUTE: Specific endpoint for lazy loading text
router.get('/:id/description', courseController.getCourseDescription);

module.exports = router;