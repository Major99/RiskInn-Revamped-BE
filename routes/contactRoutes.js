const express = require('express');
const { submitContactForm } = require('../controllers/contactController');

const router = express.Router();

router.route('/submit')
    .post(submitContactForm); 

module.exports = router;