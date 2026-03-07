const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Submit contact form (public endpoint)
router.post('/', contactController.submitContact);

// Get all contacts (admin endpoint)
router.get('/', contactController.getAllContacts);

// Get contact statistics (admin endpoint)
router.get('/stats', contactController.getContactStats);

// Get single contact by ID (admin endpoint)
router.get('/:id', contactController.getContactById);

// Update contact status (admin endpoint)
router.patch('/:id/status', contactController.updateContactStatus);

// Delete a contact (admin endpoint)
router.delete('/:id', contactController.deleteContact);

module.exports = router;
