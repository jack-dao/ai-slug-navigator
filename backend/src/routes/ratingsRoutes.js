const express = require('express');
const router = express.Router();
const { getRatings } = require('../controllers/ratingsController');

router.get('/', getRatings);

module.exports = router;