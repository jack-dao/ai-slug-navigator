const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getCourses);
router.get('/info', courseController.getSchoolInfo);
router.get('/terms', courseController.getTerms);

router.get('/:id/description', courseController.getCourseDescription);

module.exports = router;