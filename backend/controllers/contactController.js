const Contact = require('../models/Contact');
const { sendStatusUpdateEmail } = require('../utils/email');

// Submit a new contact form
exports.submitContact = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, subject, message } = req.body;

    // Validate required fields
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, subject, message)'
      });
    }

    const contactData = {
      fullName,
      email,
      phoneNumber: phoneNumber || '',
      subject,
      message
    };

    const contact = new Contact(contactData);
    await contact.save();

    console.log(`✅ New contact form submitted from: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you within 24 hours.',
      contact: {
        id: contact._id,
        fullName: contact.fullName,
        submittedAt: contact.submittedAt
      }
    });
  } catch (error) {
    console.error('❌ Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again.',
      error: error.message
    });
  }
};

// Get all contact submissions (for admin)
exports.getAllContacts = async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;

    // Build query filter
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const contacts = await Contact.find(filter)
      .sort({ submittedAt: -1 }) // Latest first
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const totalCount = await Contact.countDocuments(filter);

    res.json({
      success: true,
      count: contacts.length,
      total: totalCount,
      contacts
    });
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: error.message
    });
  }
};

// Get a single contact by ID
exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('❌ Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact',
      error: error.message
    });
  }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'read', 'responded', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact status updated successfully',
      contact
    });

    try {
      await sendStatusUpdateEmail({
        to: contact.email,
        title: 'contact request',
        referenceId: contact._id.toString().slice(-8).toUpperCase(),
        status,
        summary: contact.subject ? `Subject: ${contact.subject}` : ''
      });
    } catch (emailError) {
      console.error('❌ Failed to send contact status email:', emailError);
    }
  } catch (error) {
    console.error('❌ Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status',
      error: error.message
    });
  }
};

// Delete a contact
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message
    });
  }
};

// Get contact statistics (for admin dashboard)
exports.getContactStats = async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const newContacts = await Contact.countDocuments({ status: 'new' });
    const respondedContacts = await Contact.countDocuments({ status: 'responded' });
    const closedContacts = await Contact.countDocuments({ status: 'closed' });

    // Get recent contacts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentContacts = await Contact.countDocuments({
      submittedAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        total: totalContacts,
        new: newContacts,
        responded: respondedContacts,
        closed: closedContacts,
        recentWeek: recentContacts
      }
    });
  } catch (error) {
    console.error('❌ Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact statistics',
      error: error.message
    });
  }
};

module.exports = exports;
