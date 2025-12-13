const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const BillingSettings = require('../models/BillingSettings');

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let settings = await BillingSettings.findOne({ isActive: true });
    if (!settings) {
      settings = await BillingSettings.create({});
    }
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching billing settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch billing settings' });
  }
});

router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      companyName,
      companyLogo,
      gstNumber,
      panNumber,
      address,
      phone,
      email,
      website,
      bankDetails,
      termsAndConditions,
      footerNote
    } = req.body;

    let settings = await BillingSettings.findOne({ isActive: true });
    if (!settings) {
      settings = new BillingSettings({});
    }

    if (companyName !== undefined) settings.companyName = companyName;
    if (companyLogo !== undefined) settings.companyLogo = companyLogo;
    if (gstNumber !== undefined) settings.gstNumber = gstNumber;
    if (panNumber !== undefined) settings.panNumber = panNumber;
    if (phone !== undefined) settings.phone = phone;
    if (email !== undefined) settings.email = email;
    if (website !== undefined) settings.website = website;
    if (termsAndConditions !== undefined) settings.termsAndConditions = termsAndConditions;
    if (footerNote !== undefined) settings.footerNote = footerNote;

    if (address) {
      settings.address = {
        street: address.street || settings.address?.street || '',
        city: address.city || settings.address?.city || '',
        state: address.state || settings.address?.state || '',
        pincode: address.pincode || settings.address?.pincode || '',
        country: address.country || settings.address?.country || 'India'
      };
    }

    if (bankDetails) {
      settings.bankDetails = {
        bankName: bankDetails.bankName || settings.bankDetails?.bankName || '',
        accountNumber: bankDetails.accountNumber || settings.bankDetails?.accountNumber || '',
        ifscCode: bankDetails.ifscCode || settings.bankDetails?.ifscCode || '',
        accountHolderName: bankDetails.accountHolderName || settings.bankDetails?.accountHolderName || ''
      };
    }

    await settings.save();
    res.json({ success: true, message: 'Billing settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating billing settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update billing settings' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const settings = await BillingSettings.findOne({ isActive: true }).select(
      'companyName companyLogo gstNumber address phone email website footerNote'
    );
    res.json({ success: true, settings: settings || {} });
  } catch (error) {
    console.error('Error fetching public billing settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch billing settings' });
  }
});

module.exports = router;
