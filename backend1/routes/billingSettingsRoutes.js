const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/authMiddleware');
const BillingSettings = require('../models/BillingSettings');

router.get('/', adminAuth, async (req, res) => {
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

router.put('/', adminAuth, async (req, res) => {
  try {
    const {
      companyName,
      companyLogo,
      gstNumber,
      panNumber,
      cinNumber,
      address,
      phone,
      email,
      website,
      centreDetails,
      taxSettings,
      authorizedSignatory,
      bankDetails,
      termsAndConditions,
      footerNote,
      invoicePrefix
    } = req.body;

    let settings = await BillingSettings.findOne({ isActive: true });
    if (!settings) {
      settings = new BillingSettings({});
    }

    if (companyName !== undefined) settings.companyName = companyName;
    if (companyLogo !== undefined) settings.companyLogo = companyLogo;
    if (gstNumber !== undefined) settings.gstNumber = gstNumber;
    if (panNumber !== undefined) settings.panNumber = panNumber;
    if (cinNumber !== undefined) settings.cinNumber = cinNumber;
    if (phone !== undefined) settings.phone = phone;
    if (email !== undefined) settings.email = email;
    if (website !== undefined) settings.website = website;
    if (termsAndConditions !== undefined) settings.termsAndConditions = termsAndConditions;
    if (footerNote !== undefined) settings.footerNote = footerNote;
    if (invoicePrefix !== undefined) settings.invoicePrefix = invoicePrefix;

    if (address) {
      settings.address = {
        street: address.street || settings.address?.street || '',
        city: address.city || settings.address?.city || '',
        state: address.state || settings.address?.state || '',
        pincode: address.pincode || settings.address?.pincode || '',
        country: address.country || settings.address?.country || 'India'
      };
    }

    if (centreDetails) {
      settings.centreDetails = {
        name: centreDetails.name || settings.centreDetails?.name || '',
        address: centreDetails.address || settings.centreDetails?.address || '',
        city: centreDetails.city || settings.centreDetails?.city || '',
        state: centreDetails.state || settings.centreDetails?.state || '',
        stateCode: centreDetails.stateCode || settings.centreDetails?.stateCode || ''
      };
    }

    if (taxSettings) {
      settings.taxSettings = {
        cgstRate: taxSettings.cgstRate ?? settings.taxSettings?.cgstRate ?? 9,
        sgstRate: taxSettings.sgstRate ?? settings.taxSettings?.sgstRate ?? 9,
        igstRate: taxSettings.igstRate ?? settings.taxSettings?.igstRate ?? 18,
        defaultHsnCode: taxSettings.defaultHsnCode || settings.taxSettings?.defaultHsnCode || '999293'
      };
    }

    if (authorizedSignatory) {
      settings.authorizedSignatory = {
        name: authorizedSignatory.name || settings.authorizedSignatory?.name || '',
        designation: authorizedSignatory.designation || settings.authorizedSignatory?.designation || '',
        signatureImage: authorizedSignatory.signatureImage || settings.authorizedSignatory?.signatureImage || ''
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
